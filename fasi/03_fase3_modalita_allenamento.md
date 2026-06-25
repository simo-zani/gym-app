# Fase 3 — Modalità allenamento

> Obiettivo: schermata "esegui scheda" che mi guida set per set con timer automatici per recupero ed esercizi a tempo, salvando ogni set come `workout_session_set`. Le 3 schermate del mockup vanno implementate qui.
>
> **Ancora tutto online**, l'offline arriva in Fase 4 (ma la logica di stato che scriviamo ora dev'essere pensata per essere "pronta" all'offline).

## Deliverable

- [ ] Route `/plans/:id/run` — punto d'ingresso dell'allenamento
- [ ] Creazione `workout_session` all'avvio
- [ ] Schermata "esercizio attivo" (reps) con bottone "Fatto"
- [ ] Schermata "esercizio a tempo" con countdown rosso, beep di fine
- [ ] Schermata "recupero" con countdown verde, beep + vibrazione di fine
- [ ] Bottoni ±15s e Salta sul recupero
- [ ] Modifica reps al volo (se hai fatto 8 invece di 10)
- [ ] Modifica peso al volo (stepper)
- [ ] Inserimento `workout_session_set` ad ogni "Fatto"
- [ ] Riepilogo finale: durata totale, esercizi completati, set completati, note opzionali
- [ ] Pulsante "Termina allenamento" sempre raggiungibile (chiude sessione, segna `ended_at`)
- [ ] Wake Lock API per evitare che lo schermo dell'iPhone si spenga durante l'allenamento

## Architettura dello stato

Lo stato dell'allenamento è **complesso** e va isolato in uno store dedicato. Opzioni:
- **Zustand** (raccomandato — leggero, semplice, sync con localStorage facile)
- React Context + reducer (più verboso)

```bash
npm i zustand
```

### Modello stato

```ts
type WorkoutMode = 'reps' | 'time';

type ExerciseInSession = {
  planExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  mode: WorkoutMode;
  totalSets: number;
  reps?: number;
  durationSeconds?: number;
  weightKg?: number | null;
  restSeconds: number;
  notes?: string | null;
};

type SetResult = {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  mode: WorkoutMode;
  repsDone?: number;
  durationSecondsDone?: number;
  weightKg?: number | null;
  restSecondsTaken?: number;
  completedAt: string; // ISO
};

type Phase =
  | { kind: 'idle' }
  | { kind: 'exercising'; setNumber: number; secondsLeft?: number; secondsElapsed?: number }
  | { kind: 'resting'; secondsLeft: number; totalRest: number; nextSet: { exerciseIndex: number; setNumber: number } }
  | { kind: 'completed' };

type WorkoutState = {
  sessionId: string | null;
  planId: string | null;
  planName: string;
  startedAt: string | null;
  exercises: ExerciseInSession[];
  currentExerciseIndex: number;
  phase: Phase;
  sets: SetResult[];           // tutti i set completati nella sessione

  // azioni
  start: (plan: { id: string; name: string; exercises: ExerciseInSession[] }) => Promise<void>;
  completeCurrentSet: (overrides?: { repsDone?: number; weightKg?: number; durationDone?: number }) => Promise<void>;
  startTimedExercise: () => void;
  abortTimedExercise: () => void;
  adjustRest: (deltaSeconds: number) => void;
  skipRest: () => void;
  finish: (notes?: string) => Promise<void>;
  reset: () => void;
};
```

### Flusso logico

```
[start] → fetch plan + exercises → create workout_session → 
phase = exercising(setNumber=1) per exercise[0]

  ┌─ se mode='reps': mostra schermata 1
  │    [Fatto] → save set → 
  │       se setNumber < totalSets → phase=resting (poi setNumber++)
  │       se setNumber == totalSets → 
  │          se currentExerciseIndex < exercises.length-1 → phase=resting (poi next exercise, set=1)
  │          else → phase=completed
  │
  └─ se mode='time': mostra schermata 3
       [Inizia] → countdown → al termine (o stop) → save set → resting come sopra
```

## Timer engine

### Implementazione

Un singolo `useEffect` con `requestAnimationFrame` (più preciso di `setInterval` per timer brevi) oppure `setInterval(50ms)` che decrementa lo stato. Usa `Date.now()` come anchor, non un contatore incrementale (evita drift).

```ts
function useCountdown(active: boolean, targetEpochMs: number | null, onEnd: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!active || !targetEpochMs) return;
    const tick = () => {
      const ms = targetEpochMs - Date.now();
      if (ms <= 0) {
        setSecondsLeft(0);
        onEnd();
        return;
      }
      setSecondsLeft(Math.ceil(ms / 1000));
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [active, targetEpochMs, onEnd]);
  return secondsLeft;
}
```

### Persistenza timer su reload

L'`anchor` (`targetEpochMs` per il countdown, `startEpochMs` per il count-up) va salvato in `sessionStorage` insieme allo stato. Se ricarichi la pagina mentre sei in recupero, ricalcoli i secondi rimasti da `targetEpochMs - Date.now()`. Critico per affidabilità.

## Audio feedback

```ts
// suoni brevi via Web Audio API per evitare di caricare file
function playBeep(frequency = 880, duration = 200) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
  osc.start();
  osc.stop(ctx.currentTime + duration / 1000);
}

// fine recupero: 3 beep crescenti
function playRestEnd() { playBeep(660); setTimeout(() => playBeep(880), 220); setTimeout(() => playBeep(1100, 400), 440); }
// fine esercizio a tempo: 2 beep gravi
function playTimeEnd() { playBeep(440, 300); setTimeout(() => playBeep(330, 500), 320); }

// vibrazione (Android sì, iOS no — non disponibile su Safari mobile)
if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
```

> ⚠️ **iOS Audio**: Safari blocca audio finché non c'è interazione utente. Lo "sblocco" avviene al primo tap (cioè all'inizio dell'allenamento) — basta un primo `AudioContext.resume()` nel click "Inizia allenamento". Da quel momento i beep funzionano per tutta la sessione.

## Wake Lock

```ts
useEffect(() => {
  let lock: WakeLockSentinel | null = null;
  (async () => {
    try {
      lock = await navigator.wakeLock.request('screen');
    } catch (e) { /* non supportato */ }
  })();
  return () => { lock?.release(); };
}, []);
```

Supportato da Safari 16.4+. Va richiamato anche su `visibilitychange` (l'iPhone lo rilascia se l'app va in background).

## Salvataggio set su Supabase

Ad ogni "Fatto" o fine timer:

```ts
await supabase.from('workout_session_sets').insert({
  session_id: sessionId,
  exercise_id: ex.exerciseId,
  exercise_name_snapshot: ex.exerciseName,
  set_number: setNumber,
  mode: ex.mode,
  reps_done: ex.mode === 'reps' ? repsDone : null,
  duration_seconds_done: ex.mode === 'time' ? durationDone : null,
  weight_kg: ex.weightKg,
  rest_seconds_taken: null, // riempito al termine del recupero
  completed_at: new Date().toISOString(),
});
```

> ⚠️ Questa insert in Fase 4 diventerà "scrivi in Dexie, poi enqueue sync". Per ora scrive direttamente Supabase. Tieni la logica isolata in un service `workoutRepository.ts` così in Fase 4 sostituisci solo l'implementazione.

## Layout schermate (riferimento mockup)

| Schermata | File componente | Quando |
|-----------|-----------------|--------|
| Esercizio attivo (reps) | `<RepsExerciseScreen />` | `phase.kind === 'exercising'` && `mode === 'reps'` |
| Esercizio a tempo | `<TimedExerciseScreen />` | `phase.kind === 'exercising'` && `mode === 'time'` |
| Recupero | `<RestScreen />` | `phase.kind === 'resting'` |
| Riepilogo finale | `<WorkoutSummaryScreen />` | `phase.kind === 'completed'` |

Tutti dentro `<WorkoutRunner />` che è la pagina `/plans/:id/run`.

## Edge cases da gestire

- [ ] Utente esce dalla pagina a metà allenamento → conferma "Sei sicuro? L'allenamento in corso verrà perso" (o salvato come incompleto)
- [ ] Reload pagina durante recupero → timer ripristinato da `sessionStorage`
- [ ] Esercizio senza peso (es. piegamenti) → il widget peso si nasconde / mostra "corpo libero"
- [ ] Skip esercizio → set di quel set salvati come fatti (nessuno) oppure marca esercizio "skipped" (per ora: skip = passa al prossimo esercizio senza salvare set rimanenti)
- [ ] Modifica reps "al volo" prima di confermare → permettere stepper inline nel CTA
- [ ] Timer arriva a 0 durante esercizio a tempo → autoavanza a recupero, ma se l'utente vuole continuare può premere "+15s" prima dello scadere

## Checklist completamento Fase 3

- [ ] Posso iniziare un allenamento da una scheda e mi appare la schermata 1
- [ ] Premo "Fatto" e parte il recupero verde con il countdown corretto
- [ ] A fine recupero parte beep + (su Android) vibrazione
- [ ] Il set successivo carica i dati giusti (peso, reps, serie)
- [ ] Esercizio a tempo: countdown rosso, beep a fine, autoavanza a recupero
- [ ] Bottoni ±15s e Salta funzionano
- [ ] Modifica peso/reps al volo viene salvata nel set
- [ ] A fine allenamento vedo riepilogo con durata totale e conta set
- [ ] In `workout_session_sets` vedo tutti i set inseriti correttamente
- [ ] Schermo iPhone non si spegne durante l'allenamento (Wake Lock)
- [ ] Reload a metà non perde lo stato del timer

## Cosa NON facciamo in questa fase

- ❌ Funzionamento offline → Fase 4
- ❌ Grafici progresso pesi → Fase 5
- ❌ Confronto con allenamento precedente ("la volta scorsa hai fatto X kg") → Fase 5

## Note per Claude Code

- **Isola tutta la logica DB in un service** (`src/features/workout/workoutRepository.ts`) con interfacce pulite (`createSession`, `saveSet`, `finishSession`). In Fase 4 sostituiremo l'implementazione con la versione offline-first senza toccare i componenti.
- Per il timer engine, scrivi un hook `useCountdown` riusabile e testato a parte (anche solo manualmente)
- Mostra sempre i numeri con `font-variant-numeric: tabular-nums` per evitare il "salto" visivo dei minuti/secondi
- Il bottom-action bar deve essere `position: sticky bottom-0` con safe-area-inset (iPhone con notch)
- Conferma di "Esci dall'allenamento" via `<Modal />`, mai `confirm()` nativo
