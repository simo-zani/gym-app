# Fase 4 — Offline-first & PWA

> Obiettivo: l'app funziona **completamente offline** in palestra. Tutte le schede, esercizi, e l'esecuzione dell'allenamento sono leggibili e scrivibili senza connessione. Quando torna la rete, sync bidirezionale con Supabase.
>
> Installabile su iPhone via "Aggiungi a Home Screen" da Safari.

## Deliverable

- [ ] Service Worker generato da `vite-plugin-pwa`
- [ ] Manifest PWA con icone (192, 512, maskable)
- [ ] App caricabile offline (HTML/CSS/JS cachato)
- [ ] DB locale Dexie con stesse tabelle di Supabase
- [ ] Tutte le query/mutation passano da `db.ts` invece che da `supabase` direttamente
- [ ] Sync engine bidirezionale: pull al login + push delle modifiche offline
- [ ] Outbox di operazioni pending (insert/update/delete) replicate in ordine
- [ ] Indicatore di stato online/offline + n. operazioni in coda
- [ ] Install banner su iOS funzionante (test reale su iPhone)
- [ ] Pulsante "Forza sync ora"

## Stack aggiuntivo

```bash
npm i dexie dexie-react-hooks
npm i -D vite-plugin-pwa
```

## Schema Dexie

> Specchio fedele di Supabase, con due campi extra per il sync: `_dirty` (boolean) e `_deleted` (boolean per "tombstones").

```ts
// src/lib/db.ts
import Dexie, { type Table } from 'dexie';

export type SyncMeta = { _dirty: 0 | 1; _deleted: 0 | 1; _updatedAt: string };

export type ExerciseRow = {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  source: 'wger' | 'custom';
  external_id: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
} & SyncMeta;

// ... idem WorkoutPlanRow, WorkoutPlanExerciseRow, WorkoutSessionRow, WorkoutSessionSetRow

export type OutboxOp = {
  id?: number;
  entity: 'exercises' | 'workout_plans' | 'workout_plan_exercises' | 'workout_sessions' | 'workout_session_sets';
  op: 'insert' | 'update' | 'delete';
  rowId: string;
  payload: any;            // dati da inviare
  createdAt: string;
  attempts: number;
  lastError?: string;
};

class AppDb extends Dexie {
  exercises!: Table<ExerciseRow, string>;
  workout_plans!: Table<WorkoutPlanRow, string>;
  workout_plan_exercises!: Table<WorkoutPlanExerciseRow, string>;
  workout_sessions!: Table<WorkoutSessionRow, string>;
  workout_session_sets!: Table<WorkoutSessionSetRow, string>;
  outbox!: Table<OutboxOp, number>;
  meta!: Table<{ key: string; value: string }, string>;  // ultima sync, user_id corrente, ecc.

  constructor() {
    super('gymapp');
    this.version(1).stores({
      exercises: 'id, owner_id, muscle_group, _dirty',
      workout_plans: 'id, user_id, _dirty',
      workout_plan_exercises: 'id, plan_id, [plan_id+position], _dirty',
      workout_sessions: 'id, user_id, started_at, _dirty',
      workout_session_sets: 'id, session_id, _dirty',
      outbox: '++id, entity, createdAt',
      meta: 'key',
    });
  }
}

export const db = new AppDb();
```

## Repository pattern

In Fase 3 hai creato `workoutRepository.ts` con interfacce pulite. Ora ne crei le versioni offline-first che:
1. Leggono **sempre** da Dexie
2. Scrivono **sempre** prima su Dexie, marcando `_dirty=1`
3. Aggiungono un'op all'outbox
4. (Background) il sync engine svuota l'outbox quando online

```ts
// src/features/workout/workoutRepository.ts
export async function saveSet(input: SaveSetInput): Promise<void> {
  const row: WorkoutSessionSetRow = {
    id: crypto.randomUUID(),
    session_id: input.sessionId,
    exercise_id: input.exerciseId,
    exercise_name_snapshot: input.exerciseName,
    set_number: input.setNumber,
    mode: input.mode,
    reps_done: input.repsDone ?? null,
    duration_seconds_done: input.durationDone ?? null,
    weight_kg: input.weightKg ?? null,
    rest_seconds_taken: null,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    _dirty: 1, _deleted: 0, _updatedAt: new Date().toISOString(),
  };
  await db.transaction('rw', db.workout_session_sets, db.outbox, async () => {
    await db.workout_session_sets.put(row);
    await db.outbox.add({
      entity: 'workout_session_sets', op: 'insert', rowId: row.id,
      payload: { ...row, _dirty: undefined, _deleted: undefined, _updatedAt: undefined },
      createdAt: new Date().toISOString(), attempts: 0,
    });
  });
  // tentativo immediato di flush se online (non-blocking)
  void syncEngine.flush();
}
```

## Sync engine

### Trigger di sync

- Al boot (dopo login)
- Quando l'app rileva `online` (event `window.online`)
- Su pulsante manuale "Sync ora"
- Periodicamente (ogni 30s se online) — opzionale

### Pull strategy

```ts
async function pull(userId: string) {
  const lastPulledAt = await getMeta('last_pull_at');  // ISO o null
  
  // Per ogni entity, prendi tutte le righe modificate dopo lastPulledAt
  const since = lastPulledAt ?? '1970-01-01';

  const [plans, exes, wpe, sessions, sets, globalExes] = await Promise.all([
    supabase.from('workout_plans').select('*').gt('updated_at', since),
    supabase.from('exercises').select('*').eq('owner_id', userId).gt('updated_at', since),
    supabase.from('workout_plan_exercises').select('*').gt('updated_at', since),
    supabase.from('workout_sessions').select('*').gt('updated_at', since),
    supabase.from('workout_session_sets').select('*').gt('created_at', since),
    // esercizi globali: prendili solo al primo pull (o cambia strategia se serve aggiornarli)
    lastPulledAt ? Promise.resolve({ data: [] }) : supabase.from('exercises').select('*').is('owner_id', null),
  ]);

  // Merge in Dexie: ogni riga remota sovrascrive la locale SE remote.updated_at > local.updated_at AND local._dirty = 0
  // se local._dirty = 1, il record locale ha priorità (lo pusheremo nel push)
  await mergeIntoLocal(plans.data, db.workout_plans);
  // ... idem altri
  
  await setMeta('last_pull_at', new Date().toISOString());
}
```

### Push strategy

```ts
async function push() {
  const ops = await db.outbox.orderBy('createdAt').toArray();
  for (const op of ops) {
    try {
      if (op.op === 'insert' || op.op === 'update') {
        await supabase.from(op.entity).upsert(op.payload).throwOnError();
      } else if (op.op === 'delete') {
        await supabase.from(op.entity).delete().eq('id', op.rowId).throwOnError();
      }
      // marca riga locale come pulita
      await db.table(op.entity).update(op.rowId, { _dirty: 0 });
      await db.outbox.delete(op.id!);
    } catch (e: any) {
      await db.outbox.update(op.id!, { 
        attempts: op.attempts + 1, 
        lastError: e.message 
      });
      // se errori transienti, ferma e ritenta dopo
      if (isNetworkError(e)) break;
      // se errore permanente (RLS, constraint), salta l'op ma logga (per ora lasciamola in outbox)
    }
  }
}
```

### Conflitti

Strategia semplice: **last-write-wins** basata su `updated_at`. Se devi modificare la stessa scheda da due dispositivi offline contemporaneamente, vince l'ultima sync. Per uso personale è ampiamente sufficiente.

> ⚠️ I `workout_session_sets` sono **append-only** (mai modificati dopo l'insert), quindi conflitti zero su quella tabella che è la più sensibile.

## Configurazione vite-plugin-pwa

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'GymApp',
        short_name: 'GymApp',
        description: 'Workout tracker personale',
        theme_color: '#060b1a',
        background_color: '#060b1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',           // CRITICO: tiene la navigazione DENTRO l'app standalone
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
});
```

## Comportamento standalone (no barra browser, no "X esci")

> Obiettivo: una volta installata, l'app si apre a tutto schermo e passando da una pagina all'altra **non** mostra la barra del browser né il pulsante X che riporta alla home del browser.

Tre condizioni, tutte già coperte dallo stack tranne lo `scope` (aggiunto sopra):

1. **`display: 'standalone'`** nel manifest → l'app, una volta *installata*, si apre senza chrome del browser. ⚠️ Vale solo dopo l'installazione (Android: "Installa app" / iOS: "Aggiungi a schermata Home"). Se apri il link normale nel browser la barra resta: è il comportamento atteso.
2. **`scope: '/'`** nel manifest → definisce quali URL appartengono all'app. Se la navigazione resta dentro lo scope, rimane in modalità standalone. Se un link punta fuori scope (altro dominio, o un percorso fuori da `/`), Android lo apre in una scheda separata con la X → ecco da dove arriva il "esci dall'app".
3. **Routing solo client-side con React Router** → cambiare pagina deve avvenire via `<Link>` / `navigate()` (JavaScript, nessun reload completo), mai con `<a href>` verso pagine esterne o redirect a domini diversi. Già garantito dallo stack scelto.

Regola pratica per evitare la X: ogni link interno passa da React Router; ogni link esterno (es. fonte wger, policy) va aperto con `target="_blank" rel="noopener"`, così esce di proposito in una scheda nuova senza buttare fuori l'app.

### Test standalone (da fare insieme ai test offline)

- Installa l'app (Android: menu → Installa; iOS: Condividi → Aggiungi a Home Screen)
- Aprila dall'icona della home → niente barra indirizzi
- Naviga tra Schede → Allenamento → Storico → Profilo: deve restare tutto a tutto schermo, **nessuna X** che riporta al browser
- Su Android, premi il tasto Indietro di sistema: torna alla pagina precedente dentro l'app, non esce

## Icone iPhone

iOS richiede:
- `apple-touch-icon` 180x180 nell'HTML
- Niente icone con angoli arrotondati (iOS le smussa da sé)
- `<meta name="apple-mobile-web-app-capable" content="yes" />`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`

```html
<!-- index.html -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="GymApp" />
<meta name="theme-color" content="#060b1a" />
```

## Indicatore stato sync

Piccolo widget in alto a destra o nella tab Profilo:

```
🟢 Online · sincronizzato
🟡 Online · 3 modifiche in coda  [Sync ora]
🔴 Offline · 7 modifiche locali da inviare
```

Implementazione: hook `useSyncStatus()` che osserva `navigator.onLine` + count dell'outbox via `useLiveQuery` di `dexie-react-hooks`.

## Test del flusso offline (CRITICO)

Prima di considerare la fase completa, fai questi test concreti:

1. **Test box di palestra simulato**:
   - Apri DevTools → Network → Offline
   - Inizia un allenamento, completa 3 set
   - Verifica che tutti i set sono in `workout_session_sets` di Dexie
   - Verifica che outbox ha 3 entries
   - Torna online → outbox si svuota, Supabase ha i 3 record

2. **Test reload offline**:
   - Vai offline
   - Reload della pagina (hard reload Ctrl+Shift+R)
   - L'app deve aprirsi normalmente (service worker serve dalla cache)
   - I dati devono essere ancora visibili

3. **Test multi-device** (opzionale):
   - Modifica scheda da PC online
   - Apri iPhone → fai pull → vedi modifiche

4. **Test installazione iPhone**:
   - Safari → URL Vercel → Condividi → Aggiungi a Home Screen
   - Apri da home screen → niente barra Safari, icona corretta, splash screen

## Edge cases sync

- [ ] Token Supabase scaduto durante sync → refresh automatico + retry
- [ ] Conflitto su update (entrambi i lati hanno modificato): vince il `_updatedAt` più recente
- [ ] Eliminazione locale di una riga che remoto ha modificato: la cancellazione vince (delete = tombstone con timestamp)
- [ ] Outbox con > 100 entries: batch in chunk da 20
- [ ] Schema migration locale (versione 2): script di migrazione Dexie

## Checklist completamento Fase 4

- [ ] App installata su iPhone via "Aggiungi a Home Screen"
- [ ] App si apre offline (modalità aereo)
- [ ] Allenamento eseguibile offline dall'inizio alla fine
- [ ] Outbox visibile, count corretto
- [ ] Riconnessione → sync automatico, outbox svuotato
- [ ] Pulsante "Sync ora" funziona
- [ ] Indicatore stato sync visibile e accurato
- [ ] Reload offline non perde dati
- [ ] Test multi-device se possibile

## Cosa NON facciamo in questa fase

- ❌ Sync in tempo reale via Supabase Realtime → eccessivo per uso personale, lasciamo polling/manual
- ❌ Risoluzione conflitti avanzata (3-way merge) → last-write-wins basta
- ❌ Background sync con periodic background sync API → non supportato bene su iOS

## Note per Claude Code

- **Non toccare i componenti UI**: lavora nei file repository per cambiare DB. Se hai isolato bene in Fase 3, qui modifichi `workoutRepository.ts`, `exercisesRepository.ts`, `plansRepository.ts` e basta.
- **Genera icone PNG** da una sorgente SVG (script Node con `sharp`). Mettile in `public/icons/`
- **Testa subito** con DevTools offline prima di pushare in produzione
- Dopo deploy Vercel, **fai un test reale su iPhone** prima di considerare la fase chiusa
- Aggiorna `AGGIORNAMENTO_PROGETTO.md` con: data installazione iPhone, eventuali bug iOS scoperti, versione Dexie schema
