# GymApp — Workout Tracker offline-first

App personale per gestire schede di allenamento, eseguirle in palestra con timer automatici per recupero ed esercizi a tempo, sincronizzata online ma **completamente funzionante offline** (palestra in box senza segnale).

## Stack tecnico

| Layer | Scelta | Perché |
|-------|--------|--------|
| Frontend | React 18 + Vite + TypeScript | Veloce, type-safe, già conosciuto da finanze |
| Styling | Tailwind CSS | Coerente con palette blu scuro / verde / rosso del mockup |
| Routing | React Router v6 | Standard |
| State remoto | TanStack Query (React Query) | Cache + invalidazione + sync |
| DB locale | Dexie.js (IndexedDB) | Wrapper TS su IndexedDB, semplice e potente |
| PWA / offline | vite-plugin-pwa (Workbox) | Service worker + manifest pronti |
| Backend | Supabase (Auth + Postgres) | Già in uso, free tier sufficiente |
| Seed esercizi | wger.de API | Catalogo open source di esercizi |
| Hosting | Vercel | Free tier, deploy da GitHub |

## Costo totale: 0 €

Tutti i piani gratuiti coprono ampiamente l'uso personale. La distribuzione resta gratuita come PWA installabile e come APK sideloaded; la pubblicazione su Google Play costa 25 $ una tantum, Apple App Store 99 $/anno (vedi `06_fase6_distribuzione.md`).

## Indice fasi

| File | Fase | Obiettivo | Stima |
|------|------|-----------|-------|
| `01_fase1_fondamenta.md` | Fondamenta | Setup Vite, Supabase auth, schema DB, deploy Vercel | 1-2 sere |
| `02_fase2_crud_esercizi_schede.md` | CRUD | Creazione esercizi (custom + seed wger), composizione schede | 2-3 sere |
| `03_fase3_modalita_allenamento.md` | Workout mode | Schermata "esegui" con timer reps/tempo/recupero | 2-3 sere |
| `04_fase4_offline_first.md` | Offline | PWA, Dexie, sync bidirezionale, install su iPhone, standalone | 2-3 sere |
| `05_fase5_rifiniture.md` | Polish | Storico, grafici progressi, export, template schede | a piacere |
| `06_fase6_distribuzione.md` | Distribuzione | APK via PWABuilder/Bubblewrap, Google Play, costi store | opzionale |

## File di tracciamento

- `AGGIORNAMENTO_PROGETTO.md` — stato corrente, cosa è fatto, cosa rimane, decisioni prese in corso d'opera

## Mockup di riferimento

- `00_mockup_allenamento.html` — apri in browser per vedere le 3 schermate chiave (esercizio reps, recupero, esercizio a tempo)

## Come usare questi file con Claude Code

Ogni file fase è autosufficiente: contiene obiettivi, deliverable, schema dati rilevante per quella fase, e checklist di completamento. Apri Claude Code nella cartella del progetto e dai come contesto **solo il file della fase corrente + `AGGIORNAMENTO_PROGETTO.md`**. Non serve passare tutto.

Quando una fase è completata, aggiorna `AGGIORNAMENTO_PROGETTO.md` (lo fa Claude Code stesso a fine fase) prima di passare alla successiva.

## Convenzioni di progetto

- **Lingua codice/commenti**: inglese
- **Lingua UI**: italiano
- **Branch**: `main` (deploy) + branch per fase (es. `phase-2-crud`)
- **Commit**: convenzionali (`feat:`, `fix:`, `chore:`, `docs:`)
- **Naming DB**: snake_case (Postgres convention)
- **Naming TS**: camelCase
