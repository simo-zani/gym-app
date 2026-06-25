# Fase 2 — CRUD esercizi e schede

> Obiettivo: l'utente può creare/modificare/eliminare esercizi custom, importare il catalogo wger una tantum, comporre schede di allenamento aggiungendo esercizi con sets/reps/peso/recupero/modalità.
>
> **Tutto online**, niente offline ancora. La sync viene in Fase 4.

## Deliverable

- [ ] Pagina `/exercises` — lista esercizi (globali + custom), ricerca, filtro per gruppo muscolare
- [ ] Modal/pagina "Nuovo esercizio" — nome, descrizione, gruppo muscolare
- [ ] Importazione seed wger una tantum (script o pulsante admin)
- [ ] Pagina `/plans` — lista schede dell'utente
- [ ] Pagina `/plans/:id` — editor scheda: aggiungi esercizi, riordina, configura sets/reps/peso/recupero
- [ ] Pagina `/plans/new` — crea scheda vuota
- [ ] Eliminazione/duplicazione/archiviazione scheda
- [ ] Bottom navigation: Schede · Esercizi · Storico (placeholder) · Profilo

## Layout app

Bottom navigation fissa, 4 tab:

```
┌─────────────────────┐
│   contenuto pagina  │
│                     │
├─────────────────────┤
│ 🏋  📋  📊  👤      │
│ Sch Eserc Stor Prof │
└─────────────────────┘
```

## Componenti riutilizzabili da creare

| Componente | Note |
|------------|------|
| `<Button variant="primary|secondary|danger" />` | Stile dal mockup |
| `<Input />` / `<Textarea />` | Bordi `border-bg-3`, focus `border-blueSoft` |
| `<Select />` | Per gruppi muscolari, modalità |
| `<NumberStepper />` | ± per sets, reps, peso, recupero (UX touch-friendly) |
| `<Modal />` | Per "nuovo esercizio", "conferma elimina" |
| `<EmptyState />` | "Nessuna scheda ancora, creane una" |
| `<MuscleGroupBadge />` | Pill colorato per gruppo |

## Pagina `/exercises`

### Funzionalità

- Lista virtualizzata (se > 200 elementi) di tutti gli esercizi visibili
- Search bar in alto (filtra per nome, case-insensitive)
- Chip filtri per gruppo muscolare (multi-select)
- FAB "+" in basso a destra → modal nuovo esercizio
- Tap su esercizio → modal dettaglio con descrizione; se è custom dell'utente, bottoni Modifica/Elimina

### Query

```ts
const { data } = useQuery({
  queryKey: ['exercises', { search, muscles }],
  queryFn: async () => {
    let q = supabase.from('exercises').select('*').order('name');
    if (search) q = q.ilike('name', `%${search}%`);
    if (muscles.length) q = q.in('muscle_group', muscles);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
});
```

## Importazione wger

### API endpoint

`https://wger.de/api/v2/exerciseinfo/?language=2&limit=200` (lingua 2 = inglese; per italiano = 7 ma copertura minore — meglio inglese e tradurre i nomi a mano se serve)

### Strategia

Una funzione `seedFromWger()` lanciata **una volta** (pulsante in pagina admin/profile, oppure script Node a parte). Itera con paginazione `next`, e per ogni esercizio fa upsert in `exercises` con `source='wger'`, `owner_id=null`, `external_id=<wger id>`. Da rilanciare manualmente solo se vuoi aggiornare il catalogo.

### Mappatura campi

| wger | exercises |
|------|-----------|
| `id` | `external_id` |
| `name` (preferisci `translations[0].name` se presente) | `name` |
| `description` (HTML, pulire con DOMPurify o regex semplice) | `description` |
| `muscles[0].name` (mappato sui nostri 8 gruppi) | `muscle_group` |

Esempio di mapping muscolare semplificato:
```ts
const MUSCLE_MAP: Record<string, string> = {
  'Pectoralis major': 'chest',
  'Latissimus dorsi': 'back',
  'Quadriceps femoris': 'legs',
  'Biceps femoris': 'legs',
  'Gluteus maximus': 'legs',
  'Anterior deltoid': 'shoulders',
  'Biceps brachii': 'arms',
  'Triceps brachii': 'arms',
  'Rectus abdominis': 'core',
  'Gastrocnemius': 'legs',
  // fallback: 'other'
};
```

### Idempotenza

L'upsert deve usare `external_id` come conflict key:
```sql
insert into exercises (...) values (...)
on conflict (external_id) where source = 'wger' do update set
  name = excluded.name, description = excluded.description, ...;
```
Aggiungere index unico parziale:
```sql
create unique index exercises_wger_unique
  on exercises(external_id) where source = 'wger';
```

## Pagina `/plans/:id` — editor scheda

### Layout

```
┌─ Header: nome scheda (editabile inline) ─┐
│ Note: ...                                 │
├───────────────────────────────────────────┤
│ ☰ 1. Panca piana   [4×10 · 60kg · 90s] ✏️│
│ ☰ 2. Croci manubri [3×12 · 12kg · 60s] ✏️│
│ ☰ 3. Plank         [3×45" · — · 30s]   ✏️│
│                                           │
│        [ + Aggiungi esercizio ]           │
├───────────────────────────────────────────┤
│   [ ▶ Inizia allenamento ]  (CTA grande)  │
└───────────────────────────────────────────┘
```

### Drag & drop riordinamento

Usa `@dnd-kit/sortable` (leggera, touch-friendly):
```bash
npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Al drop, ricalcola `position` di tutte le righe e fai un batch `upsert` su `workout_plan_exercises`.

### Modal "Aggiungi/Modifica esercizio nella scheda"

Campi:
- **Esercizio** (select con search da `exercises` tabella)
- **Modalità**: toggle "Ripetizioni / Tempo"
- Se reps: **Serie** (stepper, default 3) + **Ripetizioni** (stepper, default 10)
- Se tempo: **Serie** + **Durata in secondi** (stepper, default 30)
- **Peso (kg)** — opzionale, stepper con step 1.25
- **Recupero (secondi)** — stepper con step 15, default 60
- **Note** — textarea opzionale

### CTA "Inizia allenamento"

In Fase 2 può essere disabilitato o portare a una pagina placeholder "Coming in Phase 3". L'attivazione vera arriva in Fase 3.

## Schermata `/plans` — lista schede

- Lista di card con nome scheda + numero esercizi + data ultimo allenamento (placeholder per ora)
- Tap → entra in editor
- Long press / menu kebab → Duplica, Archivia, Elimina
- FAB "+" → crea nuova scheda (modal con solo "nome")

## Checklist completamento Fase 2

- [ ] Posso creare un esercizio custom e lo vedo in lista
- [ ] Posso eseguire seed wger una volta sola senza duplicati su retry
- [ ] Posso creare una scheda, darle un nome, aggiungere 3 esercizi
- [ ] Posso configurare ogni esercizio: reps O tempo, peso, recupero, note
- [ ] Posso riordinare gli esercizi con drag & drop (testato anche su touch/mobile)
- [ ] Posso eliminare una scheda e i suoi `workout_plan_exercises` vanno via in cascade
- [ ] UI segue palette/stile del mockup (blu scuro, accent blu chiaro)
- [ ] Tutto funziona anche su viewport mobile (testato in DevTools)

## Cosa NON facciamo in questa fase

- ❌ Esecuzione vera dell'allenamento → Fase 3
- ❌ Storico sessioni → Fase 5 (la tabella esiste già da Fase 1)
- ❌ Offline / sync → Fase 4
- ❌ Template di schede preimpostate → Fase 5

## Note per Claude Code

- Tutte le mutation invalidano la query corrispondente (`queryClient.invalidateQueries({ queryKey: ['plans'] })`)
- Per il drag & drop usa `arrayMove` di `@dnd-kit/sortable` per riordinare client-side, poi `Promise.all` per gli update server-side
- Per il seed wger, fai partire la chiamata da una pagina protetta solo per il primo utente (o controllo manuale) — non serve diventare una feature, va lanciata e dimenticata
- Documenta in `AGGIORNAMENTO_PROGETTO.md` quando il seed è stato eseguito e quanti esercizi sono stati importati
