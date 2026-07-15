# Aggiornamento progetto — GymApp

> Questo file è il **registro di stato** del progetto. Va aggiornato ad ogni fase completata, ad ogni decisione importante presa in corso d'opera, ad ogni bug significativo risolto. Quando passi una nuova sessione a Claude Code, questo file è il primo che gli dai come contesto (insieme al file della fase corrente).

---

## Stato corrente

**Fase attiva:** Fase 4 completata + Fase 5 iniziata (Storico + statistiche)
**Ultimo aggiornamento:** 2026-07-15

---

## Riepilogo fasi

| Fase | Stato | Iniziata | Completata | Note |
|------|-------|----------|------------|------|
| 0 — Pianificazione | ✅ Completa | — | — | Mockup creato, piano scritto |
| 1 — Fondamenta | ✅ Completa | 2026-06-25 | 2026-06-29 | Supabase live (URL: ecydsobgfryofiijkhkx), migrazioni 0001+0002 applicate, email confirm off |
| 2 — CRUD esercizi & schede | ✅ Completa | 2026-06-25 | 2026-06-29 | Backend live; seed 858 esercizi wger; test E2E ok; deploy Vercel ok |
| 2.5 — Traduzioni (i18n) | ✅ Completa | 2026-06-29 | 2026-06-29 | react-i18next + it/en.json; cambio lingua istantaneo da Impostazioni |
| 3 — Modalità allenamento | ✅ Completa | 2026-06-29 | 2026-07-01 | Zustand store, timer drift-free, beep Web Audio, wake lock, riepilogo finale, route /run. Esteso con overhaul UI (vedi sotto) |
| 3.5 — Overhaul UI workout | ✅ Completa | 2026-06-30 | 2026-07-01 | Grosso lavoro UI/UX non pianificato: exercise hub, warmup/cooldown, piramidi, skip tracking, rating sessione, riepiloghi espandibili, progress bar/ring, background timer, gesture native |
| 4 — Offline-first | ✅ Completa (codice) | 2026-07-15 | 2026-07-15 | PWA + Dexie + sync engine. Manca solo test reale su iPhone |
| 5 — Rifiniture | 🟡 In corso | 2026-07-15 | — | Fatti: §5.1 Storico (lista + dettaglio) e §5.2 statistiche (gruppo top, giorni da ultimo allenamento, heatmap stile GitHub scrollabile con anni dinamici) |
| 6 — Distribuzione | ⏸ Non iniziata | — | — | Opzionale: APK/Play Store |

Legenda: ⏸ Non iniziata · 🟡 In corso · ✅ Completa · 🐛 Bloccata

---

## Decisioni di progetto

Decisioni prese in fase di pianificazione (qui per memoria, vedi anche `README.md`):

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth + Postgres), come progetto finanze
- **DB locale**: Dexie.js (IndexedDB)
- **PWA**: vite-plugin-pwa (Workbox); `display: 'standalone'` + `scope: '/'` per app a tutto schermo senza barra browser
- **Distribuzione**: base = PWA installabile (costo 0). Eventuale APK via PWABuilder/Bubblewrap (TWA), sideload gratis o Google Play 25 $ una tantum. App native (React Native/Expo) solo se in futuro servono funzioni non coperte dal web. No Apple Developer Program (99 $/anno) salvo necessità reale.
- **Hosting**: Vercel free tier
- **Stato globale workout**: Zustand
- **Drag & drop**: @dnd-kit
- **Seed esercizi**: API wger.de, una tantum, esercizi salvati su nostro DB come `source='wger'`, `owner_id=null` (globali)
- **Email confirmation Supabase**: disabilitata (come finanze)
- **Lingua UI**: italiano · **Lingua codice**: inglese
- **Sync**: last-write-wins basato su `updated_at`; outbox di operazioni pending in Dexie
- **Conflict resolution**: nessuna logica avanzata, uso single-user
- **Palette**: blu notte (#060b1a / #0a1228) · accent blu (#60a5fa) · verde (#10b981) recupero · rosso (#ef4444) esercizio attivo

---

## Configurazione ambienti

### Supabase
- **URL progetto**: _da inserire dopo creazione_
- **Anon key**: _in Vercel env, non in repo_
- **Service role key**: _solo per script di seed locale, non in repo_

### Vercel
- **Project**: gym-app-chi-rosy
- **URL**: https://gym-app-chi-rosy.vercel.app
- **Branch deploy**: `main`
- **Env vars**:
  - `VITE_SUPABASE_URL` ✅
  - `VITE_SUPABASE_ANON_KEY` ✅

### GitHub
- **Repo**: _da creare_
- **Branch principale**: `main`

---

## Cronologia modifiche

> Formato: `YYYY-MM-DD — [Fase X] — Descrizione`

- 2026-07-15 — [Fase 5] — **Storico + statistiche** (§5.1 e §5.2 parziale):
  - **`HistoryPage`** ora funzionante (era placeholder): lista cronologica delle sessioni concluse (data, durata, n° set, n° esercizi, volume kg, emoji rating) letta da Dexie via `useLiveQuery` → funziona anche offline. Tap su una riga → `SessionDetailModal` con set raggruppati per esercizio + eventuali note. Filtra le sessioni con `ended_at` valorizzato.
  - **`features/history/HistoryStats.tsx`** — widget sopra l'elenco:
    - 3 tile: ultimo allenamento ("Oggi/Ieri/N giorni fa"), allenamenti ultimi 30 giorni, gruppo muscolare più allenato (badge colorato; ricavato incrociando `exercise_id` dei set con `db.exercises.muscle_group`).
    - **Heatmap stile GitHub** (53 settimane ≈ 1 anno), lunedì-first: quadratino verde pieno se allenato quel giorno (niente gradazione — 1 scheda/giorno). Scrollabile in orizzontale con **scrollbar nascosta** (utility `.no-scrollbar` in `styles/index.css`), parte scrollata a destra (presente). Etichette mesi (3 lettere) con spazio extra tra i mesi. **Etichette anno dinamiche** sotto la griglia: ancorate al primo mese visibile dell'anno, con comportamento sticky-push (il nuovo anno arriva da destra e spinge fuori il precedente). Posizionamento in px aggiornato sullo scroll via `requestAnimationFrame` (non ri-renderizza le celle). Tap su un quadratino → tooltip con la data (mobile-friendly, non solo hover).
  - i18n: namespace `history` esteso in it/en (stat, unità, mesi, ecc.).
  - `tsc` e `build` verdi.
- 2026-07-15 — [Fase 4] — **Offline-first implementato** (scope: schede leggibili+eseguibili offline + salvataggio allenamento offline; catalogo esercizi completo resta online per scelta esplicita — 858 esercizi offline sarebbero eccessivi). Cosa fatto:
  - **`src/lib/db.ts`** — Dexie `gymapp` v1: tabelle `exercises` (solo subset referenziato dalle schede), `workout_plans`, `workout_plan_exercises` (con `exercise_snapshot` denormalizzato per render offline), `workout_sessions` + `workout_session_sets` (con flag `_dirty`), `outbox`, `meta`. Helper `getMeta/setMeta/clearLocalData`.
  - **`src/lib/sync.ts`** — sync engine: `pullPlans` (full-replace mirror schede+esercizi referenziati), `pullSessions` (merge, non sovrascrive righe `_dirty` locali), `pushOutbox` (drena outbox in ordine di inserimento → sessione prima dei set), `runSync` (push+pull, guardia anti-concorrenza, no-op se offline), `syncNow`, `initSync` (listener `online`/visibilitychange), hook `useSyncStatus` (online/syncing/pending via `useLiveQuery`). Invalida `['plans']` dopo ogni pull.
  - **`workoutRepository.ts`** — riscritto Dexie-first: ogni write va prima su Dexie (`_dirty=1`) + outbox, poi `void runSync()` non-bloccante. Interfaccia invariata → componenti workout non toccati. `user_id` letto da `getSession()` (no network, funziona offline).
  - **`features/plans/hooks.ts`** — letture (`usePlans`/`usePlan`/`usePlanExercises`) ora da Dexie (funzionano offline); mutazioni scrivono su Supabase poi `refreshPlanMirror()` (re-pull) + invalidate. `usePlans` calcola muscoli/durata/conteggio dal mirror locale.
  - **`SyncProvider`** (in `App`) — `initSync()` una volta; sync iniziale al login; `clearLocalData()` su logout o cambio utente (isolamento account).
  - **`SyncStatusCard`** in Profilo — stato Online/Offline/Sincronizzazione/N in coda + ultima sync + pulsante "Sincronizza ora". Namespace i18n `sync` in it/en.
  - **`vite.config.ts`** — workbox: `navigateFallback` SPA + denylist API, runtimeCaching Google Fonts (CacheFirst) e Supabase (NetworkFirst). Manifest/icone già presenti da prima.
  - `tsc --noEmit` e `npm run build` verdi; SW generato (`dist/sw.js`, 20 entries precache). Bundle unico 887 kB (warning noto, code-splitting rimandato a Fase 5).
  - **Ancora da fare per chiudere la fase**: test offline reale in browser (DevTools → Offline: esegui allenamento, verifica outbox, riconnetti → svuotamento) e test installazione/uso su iPhone. Vedi checklist in `04_fase4_offline_first.md`.
  - **Stato salvataggio storico**: *scrittura* sessioni ora offline-first (Dexie+outbox→Supabase); *visualizzazione* storico (`HistoryPage`) ancora placeholder → Fase 5 §5.1.
  - **Nota architetturale**: solo `workoutRepository.ts` era isolato come da piano; `exercises/hooks.ts` e `plans/hooks.ts` chiamavano Supabase direttamente negli hook TanStack. I plans sono stati riportati su Dexie; `exercises/hooks.ts` resta online (catalogo, per scelta di scope).
- 2026-06-30 → 2026-07-01 — [Fase 3.5] — Overhaul UI/UX workout (non pianificato, esteso oltre la Fase 3 base). Commit principali:
  - `87859df` workout runner: esercizi a tempo, modalità piramide, warmup/cooldown, progress bar, pause/resume, exercise hub, popup riepilogo recuperi
  - `756c5fb` background timer support + miglioramenti UI/UX
  - `210ed8a` overhaul completo con selezione esercizi e skip tracking
  - `81d7500` timer fixes + exercise selection
  - `240d3cf` polish progress bar/ring + cleanup plan editor
  - `4d9174e` redesign overview allenamento, riepiloghi espandibili, rating sessione
  - Extra style/gesture (`fa6886f`, `5b54584`, `8301467`, `2acbf7f`, `efef726`): disabilitati zoom/pinch/double-tap/long-press per feel nativo, safe-area top, glassmorphism bottom nav, search bar collapse
  - Nuovi componenti workout: `ExerciseHubScreen`, `WarmupScreen`, `CooldownScreen`, `ExerciseProgressBar`, `useElapsedSeconds`
- 2026-06-25 — [Fase 1] — Scaffolding progetto: Vite + React 18 + TS + Tailwind, routing (login/home protetta), AuthProvider Supabase (signIn/signUp/signOut), TanStack Query, UI primitives (Button/Input), AppShell. Migrazione SQL completa `supabase/migrations/0001_init.sql` (5 tabelle + trigger updated_at + RLS su tutte). `vercel.json` con rewrite SPA. `npm run build` e `tsc --noEmit` verdi.
- 2026-06-29 — [Fase 3] — Modalità allenamento completa:
  - **Zustand store** (`useWorkoutStore.ts`) con state machine idle→starting→exercising/timed_running→resting→completed, persistita in sessionStorage per sopravvivere ai reload
  - **workoutRepository.ts**: service layer isolato (createSession, saveSet, finishSession) — in Fase 4 si sostituisce solo l'implementazione
  - **audio.ts**: beep Web Audio API sintetizzati (no file), unlockAudio() per iOS Safari
  - **useCountdown.ts**: hook drift-free con Date.now() anchor e onEnd ref-safe
  - **Schermate**: RepsExerciseScreen (stepper reps/peso inline), TimedExerciseScreen (countdown rosso, start/stop), RestScreen (anello SVG verde, ±15s, salta), WorkoutSummaryScreen (trofeo, stat grid, dettaglio set, note)
  - **Wake Lock API**: richiesto all'avvio, riacquistato su visibilitychange
  - **Route** `/plans/:id/run` aggiunta (full-screen, no bottom nav)
  - **CTA "Inizia allenamento"** abilitata in PlanEditorPage (naviga a /run, disabilitata solo se scheda vuota)
  - **i18n**: sezione `workout` aggiunta in it.json e en.json (~25 chiavi)
  - Build e TypeScript check verdi; 16 file modificati/creati, commit 80bf12c
  - Installate dipendenze: `react-i18next`, `i18next`, `i18next-browser-languagedetector`
  - Configurazione i18next in `src/i18n/index.ts` con rilevamento automatico lingua browser e persistenza localStorage
  - File di traduzione: `src/i18n/locales/it.json` (italiano) e `en.json` (inglese) con ~100+ chiavi organizzate per sezione (nav, auth, plans, exercises, history, profile, common, etc.)
  - Migrati **11 file componenti** da stringhe hardcoded a `t()` calls (LoginPage, PlansPage, PlanEditorPage, ExercisesPage, ProfilePage, HistoryPage, PlanCard, PlanForm, ExerciseForm, ExerciseDetailModal, AddExerciseModal, ExerciseConfigSheet, BottomNav, MuscleGroupBadge)
  - Aggiunto **selettore di lingua** in Impostazioni (Profile page) con cambio istantaneo senza refresh
  - Fallback su italiano per chiavi mancanti; browser language detection (it/en)
  - Build e TypeScript check verdi; struttura estendibile per aggiungere nuove lingue
- 2026-06-25 — [Fase 2] — CRUD esercizi & schede completo (solo codice, backend ancora da creare):
  - **Bottom nav** a 4 tab (Schede · Esercizi · Storico · Profilo) + `TabLayout`; editor scheda a tutto schermo senza nav.
  - **AppShell** esteso: titolo custom, sottotitolo, pulsante back, footer sticky.
  - **UI primitives** nuove: `Select`, `Textarea`, `NumberStepper`, `Modal`, `BottomSheet`, `ConfirmDialog`, `EmptyState`, `MuscleGroupBadge`, `Fab`, `Spinner`. Aggiunta variante `success` (verde) al `Button`.
  - **Esercizi** (`/exercises`): lista con ricerca (debounce) + filtro multi gruppo muscolare, modale dettaglio, crea/modifica/elimina custom (con messaggio chiaro se l'esercizio è usato in una scheda → FK restrict).
  - **Schede** (`/`): lista card con conteggio esercizi + badge gruppi, crea/duplica/archivia/elimina; editor (`/plans/:id`) con riordino **drag&drop** (@dnd-kit, touch-friendly), bottom sheet di configurazione (reps/tempo, serie, peso, recupero, note), rinomina+note, CTA "Inizia allenamento" disabilitata (Fase 3).
  - **Data layer** TanStack Query: hooks `features/exercises/hooks.ts` e `features/plans/hooks.ts` con invalidazione coerente; join PostgREST per schede→esercizi.
  - **Seed wger**: script Node `scripts/seed-wger.mjs` (`npm run seed:wger`). Vedi decisione sotto sul perché non è un bottone in-app.
  - Migrazione `supabase/migrations/0002_wger_unique.sql` (indice univoco parziale su `external_id` per gli esercizi wger → idempotenza del seed).
  - Nuove dipendenze: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
  - `npm run build` e `tsc --noEmit` verdi.

---

## Decisioni prese in corso d'opera (Fase 2)

- **Seed wger via script con service role, non bottone in-app**: la policy RLS di insert su `exercises` è `with check (owner_id = auth.uid())`. Gli esercizi del catalogo wger sono globali (`owner_id = null`), quindi **non** sono inseribili da un client con anon key. Il seed gira come script Node (`scripts/seed-wger.mjs`) con la **service role key** che bypassa RLS. La service role key sta in `.env` (gitignored) solo in locale, mai nel client né nel repo. Coerente con la pianificazione (Fase 1 prevedeva la service role "solo per script di seed locale").
- **Idempotenza seed senza `onConflict` su indice parziale**: il client Supabase non sa esprimere il predicato `WHERE source='wger'` necessario a Postgres per inferire l'indice parziale in `ON CONFLICT`. Lo script quindi partiziona manualmente nuovi/esistenti (match su `external_id`) e fa insert + upsert sulla primary key. L'indice parziale resta come guardia anti-duplicati.
- **Mapping gruppi muscolari wger**: usata la `category` di wger (8 bucket puliti) invece di `muscles[0]` (nomi latini meno affidabili). Fallback `other`.
- **CTA "Inizia allenamento"** disabilitata in editor: l'esecuzione vera arriva in Fase 3.

## Bug noti / decisioni rimandate

- **Test end-to-end Fase 2 non eseguito**: manca il progetto Supabase reale (l'utente non l'ha ancora creato). Tutta la Fase 2 è verificata solo a livello di compilazione/build. Da provare appena il backend è live: vedi checklist Fase 2.
- **Peso "corpo libero"**: nel config sheet, una volta incrementato il peso non si può tornare a `null` (corpo libero) — solo a 0. Rifinitura rimandata (Fase 5).
- **Bundle > 500 kB**: warning di Vite sul chunk unico. Code-splitting rimandato (Fase 5/polish).
- **i18n (traduzioni reattive it/en + future)**: requisito aggiunto in `05_fase5_rifiniture.md` §5.11. Tutte le scritte devono passare da `t()` con cambio lingua istantaneo dalle Impostazioni senza refresh; file di traduzione per lingua, estendibile. Attualmente le stringhe sono hardcoded in italiano (Fasi 1-2) e andranno migrate. **Conviene introdurre l'infrastruttura i18n il prima possibile** per non accumulare stringhe da migrare.

---

## Metriche

- **Esercizi seed wger importati**: 858 ✅ (2026-06-29)
- **Tabelle DB create**: 5/5 ✅ (applicate su Supabase `ecydsobgfryofiijkhkx`)
- **Pagine implementate**: 6 (Login, Schede, Editor scheda, Esercizi, Storico placeholder, Profilo)
- **Test su iPhone**: mai (da fare a fine Fase 4)

---

## Prossime azioni concrete

1. ✅ Creato progetto Supabase (`ecydsobgfryofiijkhkx`) → URL + anon key in `.env`
2. ✅ SQL Editor → applicate `0001_init.sql` + `0002_wger_unique.sql`
3. ✅ Authentication → "Confirm signup" disattivato
4. ✅ `npm run seed:wger` → 858 esercizi importati
5. ✅ Test E2E Fase 2 superato (crea/modifica/elimina esercizi e schede, drag & drop ok)
6. ✅ Repo GitHub creato + collegato a Vercel
7. ✅ Deploy Vercel: https://gym-app-chi-rosy.vercel.app
8. ✅ Fase 3 + overhaul UI workout (Fase 3.5) completati

**⭐ Prossimo passo: Fase 4 — Offline-first** (PWA/service worker, Dexie mirror, sync engine outbox, indicatore stato, test su iPhone). Da decidere lo scope: solo path critico workout+sessioni offline, oppure offline-first completo anche per CRUD schede/esercizi (richiede refactor degli hook TanStack che oggi chiamano Supabase direttamente).

---

## Template per aggiornamenti futuri

> Quando completi una fase, sostituisci la riga della tabella e aggiungi una sezione tipo questa:

### Fase X — completata il YYYY-MM-DD

**Cosa è stato fatto:**
- Punto 1
- Punto 2

**Decisioni prese in corso d'opera:**
- Decisione X perché Y

**Bug risolti:**
- Bug Z: descrizione + fix

**Da tenere d'occhio:**
- Eventuali debiti tecnici o cose da rivedere

**Versione deployata:** _link Vercel + commit hash_
