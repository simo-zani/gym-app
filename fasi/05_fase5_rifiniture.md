# Fase 5 — Rifiniture

> Obiettivo: dopo Fase 4 hai un'app pienamente funzionante. La Fase 5 raccoglie tutto il "nice to have" che migliora l'esperienza ma non è critico. Da fare a piacere, anche solo alcuni pezzi.

## Aree di lavoro (a menù)

### 5.1 Storico allenamenti

- Tab `/history` (era placeholder finora)
- Lista cronologica delle `workout_sessions` con: data, scheda, durata, n. set, peso totale sollevato
- Tap → dettaglio sessione con tutti i set eseguiti
- Filtro per scheda, per range di date
- Possibilità di aggiungere/modificare note a posteriori

### 5.2 Grafici progressi

Libreria: **Recharts** (la stessa che useresti per qualsiasi cosa con React + Tailwind, integra bene)

```bash
npm i recharts
```

Grafici utili:
- **Peso per esercizio nel tempo** (un grafico per ogni esercizio principale)
- **Volume totale per allenamento** (peso × reps × set, sommati)
- **Frequenza allenamenti per mese** (heatmap stile GitHub o bar chart)
- **Personal records**: per ogni esercizio, peso massimo / reps max / tempo max

### 5.3 Confronto "rispetto alla volta scorsa"

Durante l'allenamento, sotto i dati dell'esercizio corrente, mostra in piccolo:
```
Ultima volta: 60 kg × 8 reps (12 ott)
```

Query: ultimo `workout_session_set` per quel `exercise_id` e `set_number` corrispondente.

### 5.4 Template di schede

Schede preimpostate ("Full body principianti", "Push/Pull/Legs", "Upper/Lower split") che l'utente può clonare come punto di partenza. Strutturate come JSON statico nell'app:

```ts
const TEMPLATES = [
  {
    name: 'Push Pull Legs - Push',
    exercises: [
      { exerciseSlug: 'bench-press', sets: 4, reps: 8, restSeconds: 120 },
      // ...
    ],
  },
];
```

"Clona template" risolve gli slug verso `exercises.external_id` o crea esercizi mancanti.

### 5.5 Export / import dati

- **Export JSON**: scarica tutti i tuoi dati (schede + storico) come `.json`
- **Export CSV**: storico in formato Excel-friendly
- **Import**: re-importa da JSON (utile dopo eviction storage iOS o per migrazione)

### 5.6 Calcolatori utili

- **One Rep Max (1RM)** stimato con formula Epley: `1RM = peso × (1 + reps/30)`
- **Pesi disco** ("voglio caricare 80 kg sul bilanciere da 20, quali dischi?"): calcola combinazione per lato
- **Conversione kg ↔ lb**

### 5.7 Allenamento personalizzazione

- Dark mode forzato (probabilmente già di default, ma con flag esplicito)
- Volumi audio configurabili (off / soft / loud) per i beep
- Vibrazione on/off
- Unità di misura (kg di default, opzione lb)
- Lingua interfaccia → vedi sezione dedicata **5.11 Internazionalizzazione (i18n)**

### 5.8 Pre-workout & cool-down

Sezioni opzionali in cima/fondo scheda per warm-up e stretching, con timer dedicati ma senza salvataggio di set.

### 5.9 Sostituisci esercizio al volo

Durante l'allenamento, se la postazione è occupata: bottone "sostituisci" → mostra esercizi alternativi dello stesso gruppo muscolare → l'allenamento prosegue con l'esercizio scelto (con peso/reps clonati dal precedente). Il dato salvato cambia `exercise_id` per quei set.

### 5.10 Note workout-level

A fine sessione, prompt "Come ti sei sentito? Note?" con tag rapidi (energia 1-5, eventuali infortuni). Aiuta a vedere pattern nel tempo.

### 5.11 Internazionalizzazione (i18n) — REQUISITO

> Obiettivo: **tutte** le scritte dell'app passano da un sistema di traduzione, con cambio lingua **istantaneo e reattivo** dalle impostazioni, **senza ricaricare la webapp**.

**Requisiti funzionali**

- **Nessuna stringa hardcoded nella UI**: ogni testo visibile all'utente arriva da una funzione di traduzione (`t('chiave')`), mai scritto direttamente nel JSX.
- **File di traduzione** unico (o uno per lingua) con tutte le chiavi → testo. Si parte con **italiano (`it`)** ed **inglese (`en`)**; la struttura deve permettere di **aggiungere altre lingue in futuro** semplicemente aggiungendo un nuovo set di chiavi, senza toccare i componenti.
- **Cambio lingua reattivo**: dalla pagina Impostazioni si sceglie la lingua e **tutte le scritte si aggiornano all'istante** (re-render), **senza refresh** della pagina/PWA.
- **Persistenza**: la lingua scelta è salvata (localStorage e/o tabella settings utente) e ripristinata all'avvio. Default iniziale: `it` (o lingua del browser se tra quelle supportate).
- **Fallback**: se una chiave manca nella lingua attiva, si usa la lingua di default (e in dev si logga la chiave mancante) — mai mostrare la chiave grezza all'utente.
- **Lingua di partenza**: `it`. Le scritte già scritte in italiano nelle Fasi 1-3 vanno **migrate** dentro il file di traduzione (estrazione delle stringhe).

**Architettura suggerita**

- Libreria consigliata: **`react-i18next`** (`i18next` + `react-i18next`) — il cambio lingua via `i18n.changeLanguage('en')` è reattivo di natura (tutti i componenti che usano `useTranslation()` si ri-renderizzano, niente reload). Supporta interpolazione (`t('plan.count', { n })`), plurali e namespace.
- Alternativa minimale senza dipendenze: un Context/store (lo **Zustand** già in stack) con `{ lang, setLang, t }`, e i dizionari in un file `translations.ts`. `setLang` aggiorna lo store → re-render globale. Sufficiente per un'app personale, ma `react-i18next` scala meglio su plurali/interpolazione.

**Struttura file proposta**

```
src/i18n/
  index.ts            # init i18next + config (lingue, fallback, detection)
  locales/
    it.json           # { "common": {...}, "plans": {...}, "exercises": {...}, ... }
    en.json
```

Chiavi organizzate per namespace/feature (es. `plans.newPlan`, `exercises.search`, `workout.rest`). Per aggiungere una lingua: nuovo file `xx.json` + registrazione in `index.ts`, zero modifiche ai componenti.

**Esempio d'uso nei componenti**

```tsx
const { t } = useTranslation();
<Button>{t('plans.create')}</Button>
// con interpolazione/plurale
<p>{t('plans.count', { count: plans.length })}</p>
```

**Selettore in Impostazioni (Profilo)**

```tsx
const { i18n } = useTranslation();
<Select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
  <option value="it">Italiano</option>
  <option value="en">English</option>
  {/* lingue future qui */}
</Select>
```

**Checklist 5.11**

- [ ] Tutte le stringhe UI delle fasi precedenti estratte in `it.json` (+ traduzione `en.json`)
- [ ] `t()` usato ovunque, nessuna stringa hardcoded nei componenti
- [ ] Cambio lingua da Impostazioni aggiorna l'app **senza refresh**
- [ ] Lingua persistita e ripristinata all'avvio
- [ ] Fallback su lingua di default per chiavi mancanti
- [ ] Aggiungere una nuova lingua richiede solo un nuovo file di traduzione

> Nota: idealmente l'infrastruttura `t()` va introdotta **il prima possibile** (anche prima della Fase 5) così le nuove stringhe nascono già tradotte ed evitiamo una grossa migrazione finale. La consegna formale resta in Fase 5, ma può essere anticipata.

## Checklist consigliata

Pesi e progressioni → 5.1 + 5.2 + 5.3 (questi tre danno il valore maggiore in palestra)
Praticità d'uso → 5.6 (calcolo dischi è oro vivo) + 5.9
Manutenzione → 5.5 (export JSON è la tua assicurazione contro l'eviction iOS)

## Cosa probabilmente NON serve

- ❌ Login social / OAuth (email/password basta per uso personale)
- ❌ Multi-utente con condivisione schede (a meno che tu non voglia dare le tue schede a qualcuno)
- ❌ Notifiche push (in palestra ce l'hai in mano)
- ❌ Wearable/Apple Watch integration (richiederebbe app nativa)

## Note per Claude Code

- Ogni feature 5.x può essere un PR/branch separato
- Aggiorna `AGGIORNAMENTO_PROGETTO.md` ad ogni feature completata
- Mantieni la stessa palette/qualità visiva del mockup iniziale
- Se aggiungi nuove tabelle DB, segui lo stesso pattern (Supabase + Dexie + outbox)
