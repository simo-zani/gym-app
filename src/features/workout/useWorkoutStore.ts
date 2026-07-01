/**
 * Zustand workout store — central state machine for the active workout.
 *
 * Persisted to sessionStorage so that:
 *  - Timer anchors (restTargetEpochMs) survive page reloads.
 *  - Closing the tab clears the state automatically.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { workoutRepository } from './workoutRepository';
import type { ExerciseMode, PyramidSet } from '@/types/db';

// ─── Domain types ────────────────────────────────────────────────────────────

export interface ExerciseInSession {
  planExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  mode: ExerciseMode;
  totalSets: number;
  reps: number | null;
  durationSeconds: number | null;
  weightKg: number | null;
  restSeconds: number;
  notes: string | null;
  /** Populated when mode === 'pyramid'; null otherwise. */
  pyramidConfig: PyramidSet[] | null;
}

export interface SetResult {
  planExerciseId: string;
  exerciseName: string;
  setNumber: number;
  mode: ExerciseMode;
  repsDone: number | null;
  durationSecondsDone: number | null;
  weightKg: number | null;
  completedAt: string;
}

export type Phase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'warmup'; targetEpochMs: number; isPaused?: boolean; pausedSecondsLeft?: number }
  | { kind: 'exercising' }
  | { kind: 'timed_running'; targetEpochMs: number; isPaused?: boolean; pausedSecondsLeft?: number }
  | {
      kind: 'resting';
      restTargetEpochMs: number;
      nextExerciseIndex: number;
      nextSetNumber: number;
      isPaused?: boolean;
      pausedSecondsLeft?: number;
    }
  | {
      kind: 'cooldown';
      targetEpochMs: number;
      nextExerciseIndex: number;
      nextSetNumber: number;
      isPaused?: boolean;
      pausedSecondsLeft?: number;
    }
  | { kind: 'exercise_hub'; nextExerciseIndex: number }
  | { kind: 'completed' };

// ─── Store types ─────────────────────────────────────────────────────────────

interface WorkoutState {
  sessionId: string | null;
  planId: string | null;
  planName: string;
  startedAtMs: number | null;
  exercises: ExerciseInSession[];
  currentExerciseIndex: number;
  currentSetNumber: number; // 1-based
  phase: Phase;
  sets: SetResult[];
  /** Editable reps for current set (user can change before pressing Fatto). */
  editReps: number;
  /** Editable weight for current set. null = bodyweight. */
  editWeight: number | null;
  /** Whether a DB write is in progress. */
  saving: boolean;
  /** Start time of the current exercise, used for calculating elapsed exercise time. */
  currentExerciseStartedAtMs: number | null;
}

interface WorkoutActions {
  /** Begin a new workout session. */
  start: (plan: {
    id: string;
    name: string;
    exercises: ExerciseInSession[];
  }) => Promise<void>;

  setEditReps: (reps: number) => void;
  setEditWeight: (weight: number | null) => void;

  /**
   * Mark the current set as complete.
   * Saves to DB, then advances phase to resting or completed.
   */
  completeCurrentSet: (overrides?: { durationSecondsDone?: number }) => Promise<void>;

  /** Start the countdown for a timed exercise. */
  startTimedExercise: () => void;

  /** Called when a timed exercise countdown reaches 0. */
  onTimedEnd: () => Promise<void>;

  /** Called when the rest countdown reaches 0. */
  onRestEnd: () => void;

  /** Shift the rest timer by deltaSeconds (can be negative). */
  adjustRest: (deltaSeconds: number) => void;

  /** Skip the rest immediately. */
  skipRest: () => void;

  /** Called when warmup countdown reaches 0 (or user skips). */
  onWarmupEnd: () => void;

  /** Skip warmup immediately. */
  skipWarmup: () => void;

  /** Called when cooldown countdown reaches 0 (or user skips). Transitions to resting for next exercise. */
  onCooldownEnd: () => void;

  /** Skip cooldown immediately. */
  skipCooldown: () => void;

  /** Toggle pause on active countdown timers. */
  togglePause: () => void;

  /** Transitions phase from exercise hub to next exercise's rest timer. */
  startNextExerciseAfterHub: () => void;

  /** Finish the workout session (write ended_at + notes). */
  finish: (notes?: string) => Promise<void>;

  /** Reset store to idle (called after finish navigates away). */
  reset: () => void;
}

type WorkoutStore = WorkoutState & WorkoutActions;

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL: WorkoutState = {
  sessionId: null,
  planId: null,
  planName: '',
  startedAtMs: null,
  exercises: [],
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  phase: { kind: 'idle' },
  sets: [],
  editReps: 0,
  editWeight: null,
  saving: false,
  currentExerciseStartedAtMs: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      // ── start ──────────────────────────────────────────────────────────────
      start: async (plan) => {
        set({
          phase: { kind: 'starting' },
          planId: plan.id,
          planName: plan.name,
          exercises: plan.exercises,
          sets: [],
          saving: true,
        });

        try {
          const sessionId = await workoutRepository.createSession({
            planId: plan.id,
            planName: plan.name,
          });

          const first = plan.exercises[0];
          set({
            sessionId,
            startedAtMs: Date.now(),
            currentExerciseStartedAtMs: Date.now(),
            currentExerciseIndex: 0,
            currentSetNumber: 1,
            // Start with a 10s warmup before the first set
            phase: { kind: 'warmup', targetEpochMs: Date.now() + 10_000 },
            editReps: first.reps ?? 0,
            editWeight: first.weightKg,
            saving: false,
          });
        } catch (err) {
          set({ phase: { kind: 'idle' }, saving: false });
          throw err;
        }
      },

      // ── editable fields ────────────────────────────────────────────────────
      setEditReps: (reps) => set({ editReps: Math.max(0, reps) }),
      setEditWeight: (weight) => set({ editWeight: weight }),

      // ── completeCurrentSet ─────────────────────────────────────────────────
      completeCurrentSet: async (overrides) => {
        const state = get();
        const {
          sessionId,
          exercises,
          currentExerciseIndex,
          currentSetNumber,
          editReps,
          editWeight,
        } = state;

        const ex = exercises[currentExerciseIndex];

        // Resolve the effective mode for this set (pyramid can mix reps/time per set)
        let effectiveIsTimedMode = ex.mode === 'time';
        if (ex.mode === 'pyramid' && ex.pyramidConfig) {
          const cfg = ex.pyramidConfig[currentSetNumber - 1] ?? ex.pyramidConfig[ex.pyramidConfig.length - 1];
          effectiveIsTimedMode = cfg.mode === 'time';
        }

        const repsDone = effectiveIsTimedMode ? null : editReps;
        const durationDone = effectiveIsTimedMode
          ? (overrides?.durationSecondsDone ?? ex.durationSeconds ?? 0)
          : null;

        set({ saving: true });

        // Persist the set
        try {
          if (sessionId) {
            await workoutRepository.saveSet({
              sessionId,
              planExerciseId: ex.planExerciseId,
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              setNumber: currentSetNumber,
              mode: ex.mode,
              repsDone,
              durationSecondsDone: durationDone,
              weightKg: editWeight,
            });
          }
        } catch {
          // Non-blocking: don't abort the workout on a save failure
        }

        const newSets: SetResult[] = [
          ...state.sets,
          {
            planExerciseId: ex.planExerciseId,
            exerciseName: ex.exerciseName,
            setNumber: currentSetNumber,
            mode: ex.mode,
            repsDone,
            durationSecondsDone: durationDone,
            weightKg: editWeight,
            completedAt: new Date().toISOString(),
          },
        ];

        // Determine next phase
        const isLastSet = currentSetNumber >= ex.totalSets;
        const isLastExercise = currentExerciseIndex >= exercises.length - 1;

        if (isLastSet && isLastExercise) {
          set({ phase: { kind: 'completed' }, sets: newSets, saving: false });
          return;
        }

        const nextExerciseIndex = isLastSet ? currentExerciseIndex + 1 : currentExerciseIndex;
        const nextSetNumber = isLastSet ? 1 : currentSetNumber + 1;
        const restMs = ex.restSeconds * 1000;

        // If we finished the last set of an exercise, transition to the hub screen!
        if (isLastSet && !isLastExercise) {
          const hasCooldown = ex.mode === 'time' || ex.mode === 'pyramid';
          if (hasCooldown) {
            set({
              sets: newSets,
              saving: false,
              phase: {
                kind: 'cooldown',
                targetEpochMs: Date.now() + 30_000,
                nextExerciseIndex,
                nextSetNumber,
              },
            });
            return;
          }

          set({
            sets: newSets,
            saving: false,
            phase: {
              kind: 'exercise_hub',
              nextExerciseIndex,
            },
          });
          return;
        }

        set({
          sets: newSets,
          saving: false,
          phase: {
            kind: 'resting',
            restTargetEpochMs: Date.now() + restMs,
            nextExerciseIndex,
            nextSetNumber,
          },
        });
      },

      // ── warmup ─────────────────────────────────────────────────────────────
      onWarmupEnd: () => {
        const { exercises, currentExerciseIndex } = get();
        const ex = exercises[currentExerciseIndex];
        if (!ex) {
          set({ phase: { kind: 'exercising' } });
          return;
        }

        let isTimed = ex.mode === 'time';
        if (ex.mode === 'pyramid' && ex.pyramidConfig) {
          const cfg = ex.pyramidConfig[0];
          isTimed = cfg?.mode === 'time';
        }

        if (isTimed) {
          let durationMs: number;
          if (ex.mode === 'pyramid' && ex.pyramidConfig) {
            const cfg = ex.pyramidConfig[0];
            durationMs = (cfg.duration_seconds ?? 30) * 1000;
          } else {
            durationMs = (ex.durationSeconds ?? 30) * 1000;
          }
          set({ phase: { kind: 'timed_running', targetEpochMs: Date.now() + durationMs } });
        } else {
          set({ phase: { kind: 'exercising' } });
        }
      },

      skipWarmup: () => get().onWarmupEnd(),

      // ── cooldown ───────────────────────────────────────────────────────────
      onCooldownEnd: () => {
        const { phase } = get();
        if (phase.kind !== 'cooldown') return;
        const { nextExerciseIndex } = phase;
        const nextEx = get().exercises[nextExerciseIndex];
        if (!nextEx) {
          // Last exercise, last set → workout done
          set({ phase: { kind: 'completed' } });
          return;
        }
        set({
          phase: {
            kind: 'exercise_hub',
            nextExerciseIndex,
          },
        });
      },

      skipCooldown: () => get().onCooldownEnd(),

      // ── timed exercise ─────────────────────────────────────────────────────
      startTimedExercise: () => {
        const { exercises, currentExerciseIndex, currentSetNumber } = get();
        const ex = exercises[currentExerciseIndex];

        let durationMs: number;
        if (ex.mode === 'pyramid' && ex.pyramidConfig) {
          const cfg = ex.pyramidConfig[currentSetNumber - 1] ?? ex.pyramidConfig[ex.pyramidConfig.length - 1];
          durationMs = (cfg.duration_seconds ?? 30) * 1000;
        } else {
          durationMs = (ex.durationSeconds ?? 30) * 1000;
        }
        set({ phase: { kind: 'timed_running', targetEpochMs: Date.now() + durationMs } });
      },

      onTimedEnd: async () => {
        const { phase, exercises, currentExerciseIndex } = get();
        if (phase.kind !== 'timed_running') return;
        const ex = exercises[currentExerciseIndex];
        set({ phase: { kind: 'exercising' } });
        await get().completeCurrentSet({ durationSecondsDone: ex.durationSeconds ?? 0 });
      },

      // ── rest ───────────────────────────────────────────────────────────────
      onRestEnd: () => {
        const { phase, exercises } = get();
        if (phase.kind !== 'resting') return;
        const { nextExerciseIndex, nextSetNumber } = phase;
        const nextEx = exercises[nextExerciseIndex];

        // For pyramid mode, load per-set target from pyramid_config
        let nextEditReps = nextEx.reps ?? 0;
        let nextEditWeight = nextEx.weightKg;
        if (nextEx.mode === 'pyramid' && nextEx.pyramidConfig) {
          const cfg = nextEx.pyramidConfig[nextSetNumber - 1] ?? nextEx.pyramidConfig[nextEx.pyramidConfig.length - 1];
          nextEditReps = cfg.mode === 'reps' ? (cfg.reps ?? 0) : 0;
          nextEditWeight = cfg.weight_kg;
        }

        // Set starting timestamp for next exercise if we are starting Set 1
        const nextExerciseStartedAtMs = nextSetNumber === 1 ? Date.now() : get().currentExerciseStartedAtMs;

        // Auto-start timed or timed pyramid exercises
        let isNextTimed = nextEx.mode === 'time';
        if (nextEx.mode === 'pyramid' && nextEx.pyramidConfig) {
          const cfg = nextEx.pyramidConfig[nextSetNumber - 1] ?? nextEx.pyramidConfig[nextEx.pyramidConfig.length - 1];
          isNextTimed = cfg.mode === 'time';
        }

        if (isNextTimed) {
          let durationMs: number;
          if (nextEx.mode === 'pyramid' && nextEx.pyramidConfig) {
            const cfg = nextEx.pyramidConfig[nextSetNumber - 1] ?? nextEx.pyramidConfig[nextEx.pyramidConfig.length - 1];
            durationMs = (cfg.duration_seconds ?? 30) * 1000;
          } else {
            durationMs = (nextEx.durationSeconds ?? 30) * 1000;
          }

          set({
            currentExerciseIndex: nextExerciseIndex,
            currentSetNumber: nextSetNumber,
            phase: { kind: 'timed_running', targetEpochMs: Date.now() + durationMs },
            editReps: nextEditReps,
            editWeight: nextEditWeight,
            currentExerciseStartedAtMs: nextExerciseStartedAtMs,
          });
        } else {
          set({
            currentExerciseIndex: nextExerciseIndex,
            currentSetNumber: nextSetNumber,
            phase: { kind: 'exercising' },
            editReps: nextEditReps,
            editWeight: nextEditWeight,
            currentExerciseStartedAtMs: nextExerciseStartedAtMs,
          });
        }
      },

      adjustRest: (deltaSeconds) => {
        const { phase } = get();
        if (phase.kind !== 'resting') return;
        
        // If paused, adjust the remaining paused seconds instead
        if (phase.isPaused) {
          const newPaused = Math.max(1, (phase.pausedSecondsLeft ?? 0) + deltaSeconds);
          set({ phase: { ...phase, pausedSecondsLeft: newPaused } });
          return;
        }

        const newTarget = Math.max(
          Date.now() + 1000, // minimum 1 second remaining
          phase.restTargetEpochMs + deltaSeconds * 1000,
        );
        set({ phase: { ...phase, restTargetEpochMs: newTarget } });
      },

      skipRest: () => get().onRestEnd(),

      togglePause: () => {
        const { phase } = get();
        const now = Date.now();

        if (phase.kind === 'timed_running') {
          if (phase.isPaused) {
            const newTarget = now + (phase.pausedSecondsLeft ?? 0) * 1000;
            set({ phase: { ...phase, isPaused: false, targetEpochMs: newTarget } });
          } else {
            const secondsLeft = Math.max(0, Math.ceil((phase.targetEpochMs - now) / 1000));
            set({ phase: { ...phase, isPaused: true, pausedSecondsLeft: secondsLeft } });
          }
        } else if (phase.kind === 'resting') {
          if (phase.isPaused) {
            const newTarget = now + (phase.pausedSecondsLeft ?? 0) * 1000;
            set({ phase: { ...phase, isPaused: false, restTargetEpochMs: newTarget } });
          } else {
            const secondsLeft = Math.max(0, Math.ceil((phase.restTargetEpochMs - now) / 1000));
            set({ phase: { ...phase, isPaused: true, pausedSecondsLeft: secondsLeft } });
          }
        } else if (phase.kind === 'warmup') {
          if (phase.isPaused) {
            const newTarget = now + (phase.pausedSecondsLeft ?? 0) * 1000;
            set({ phase: { ...phase, isPaused: false, targetEpochMs: newTarget } });
          } else {
            const secondsLeft = Math.max(0, Math.ceil((phase.targetEpochMs - now) / 1000));
            set({ phase: { ...phase, isPaused: true, pausedSecondsLeft: secondsLeft } });
          }
        } else if (phase.kind === 'cooldown') {
          if (phase.isPaused) {
            const newTarget = now + (phase.pausedSecondsLeft ?? 0) * 1000;
            set({ phase: { ...phase, isPaused: false, targetEpochMs: newTarget } });
          } else {
            const secondsLeft = Math.max(0, Math.ceil((phase.targetEpochMs - now) / 1000));
            set({ phase: { ...phase, isPaused: true, pausedSecondsLeft: secondsLeft } });
          }
        }
      },

      startNextExerciseAfterHub: () => {
        const { phase, exercises } = get();
        if (phase.kind !== 'exercise_hub') return;
        const { nextExerciseIndex } = phase;
        const nextEx = exercises[nextExerciseIndex];
        if (!nextEx) return;

        set({
          phase: {
            kind: 'resting',
            restTargetEpochMs: Date.now() + nextEx.restSeconds * 1000,
            nextExerciseIndex,
            nextSetNumber: 1,
          },
        });
      },

      // ── finish ─────────────────────────────────────────────────────────────
      finish: async (notes) => {
        const { sessionId } = get();
        if (sessionId) {
          try {
            await workoutRepository.finishSession(sessionId, notes);
          } catch {
            // Non-blocking
          }
        }
      },

      // ── reset ──────────────────────────────────────────────────────────────
      reset: () => set(INITIAL),
    }),
    {
      name: 'workout-store',
      storage: createJSONStorage(() => sessionStorage),
      // Don't persist `saving` (transient UI state)
      partialize: (state) => {
        const { saving: _saving, ...rest } = state;
        return rest;
      },
    },
  ),
);
