# Aggiornamento progetto — GymApp

> Questo file è il **registro di stato** del progetto. Va aggiornato ad ogni fase completata, ad ogni decisione importante presa in corso d'opera, ad ogni bug significativo risolto. Quando passi una nuova sessione a Claude Code, questo file è il primo che gli dai come contesto (insieme al file della fase corrente).

---

## Stato corrente

**Fase attiva:** Fase 2.5 — Traduzioni (i18n) completata · Fase 2 da testare E2E
**Ultimo aggiornamento:** 2026-06-29

---

## Riepilogo fasi

| Fase | Stato | Iniziata | Completata | Note |
|------|-------|----------|------------|------|
| 0 — Pianificazione | ✅ Completa | — | — | Mockup creato, piano scritto |
| 1 — Fondamenta | 🟡 In corso | 2026-06-25 | — | Codice scaffolding fatto; restano progetto Supabase reale + deploy Vercel (non ancora creati) |
| 2 — CRUD esercizi & schede | 🟡 In corso | 2026-06-25 | — | Codice completo (UI + data layer + seed wger); test end-to-end in sospeso finché manca il backend |
| 2.5 — Traduzioni (i18n) | ✅ Completa | 2026-06-29 | 2026-06-29 | react-i18next + it/en.json; cambio lingua istantaneo da Impostazioni |
| 3 — Modalità allenamento | ⏸ Non iniziata | — | — | — |
| 4 — Offline-first | ⏸ Non iniziata | — | — | — |
| 5 — Rifiniture | ⏸ Non iniziata | — | — | A piacere |
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
- **Project**: _da creare_
- **Branch deploy**: `main`
- **Env vars**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### GitHub
- **Repo**: _da creare_
- **Branch principale**: `main`

---

## Cronologia modifiche

> Formato: `YYYY-MM-DD — [Fase X] — Descrizione`

- 2026-06-25 — [Fase 1] — Scaffolding progetto: Vite + React 18 + TS + Tailwind, routing (login/home protetta), AuthProvider Supabase (signIn/signUp/signOut), TanStack Query, UI primitives (Button/Input), AppShell. Migrazione SQL completa `supabase/migrations/0001_init.sql` (5 tabelle + trigger updated_at + RLS su tutte). `vercel.json` con rewrite SPA. `npm run build` e `tsc --noEmit` verdi.
- 2026-06-29 — [Fase 2.5] — Internazionalizzazione (i18n) completa:
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

- **Esercizi seed wger importati**: 0 (script pronto: `npm run seed:wger`, da lanciare quando il backend è live)
- **Tabelle DB create**: 5/5 (SQL in `0001_init.sql` + indice wger in `0002_wger_unique.sql`, da applicare su Supabase reale)
- **Pagine implementate**: 6 (Login, Schede, Editor scheda, Esercizi, Storico placeholder, Profilo)
- **Test su iPhone**: mai (da fare a fine Fase 4)

---

## Prossime azioni concrete

Codice Fasi 1 e 2 fatto. Restano i passi manuali esterni (account), poi il test della Fase 2:

1. Creare progetto Supabase → copiare URL + anon key in `.env` (locale) e nelle env Vercel
2. SQL Editor di Supabase → eseguire in ordine `0001_init.sql` poi `0002_wger_unique.sql`
3. Authentication → disattivare "Confirm signup" (email confirmation)
4. Verificare in SQL che un utente NON veda i dati di un altro (test RLS)
5. Aggiungere la service role key in `.env` come `SUPABASE_SERVICE_ROLE_KEY`, poi `npm run seed:wger` (import catalogo wger una tantum)
6. `npm run dev` → testare la checklist Fase 2 (crea esercizio, crea scheda, aggiungi/configura/riordina esercizi, duplica/elimina)
7. Creare repo GitHub push, collegare a Vercel (framework Vite, 2 env var) → deploy `main`
8. Aggiornare questo file con URL Supabase e link Vercel; chiudere Fasi 1 e 2

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
