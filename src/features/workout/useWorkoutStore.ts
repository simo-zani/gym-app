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
import type { ExerciseMode } from '@/types/db';

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
}

export interface SetResult {
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
  | { kind: 'exercising' }
  | { kind: 'timed_running'; targetEpochMs: number }
  | {
      kind: 'resting';
      restTargetEpochMs: number;
      nextExerciseIndex: number;
      nextSetNumber: number;
    }
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
            currentExerciseIndex: 0,
            currentSetNumber: 1,
            phase: { kind: 'exercising' },
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
        const isTimedMode = ex.mode === 'time';

        const repsDone = isTimedMode ? null : editReps;
        const durationDone = isTimedMode
          ? (overrides?.durationSecondsDone ?? ex.durationSeconds ?? 0)
          : null;

        set({ saving: true });

        // Persist the set
        try {
          if (sessionId) {
            await workoutRepository.saveSet({
              sessionId,
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

      // ── timed exercise ─────────────────────────────────────────────────────
      startTimedExercise: () => {
        const ex = get().exercises[get().currentExerciseIndex];
        const ms = (ex.durationSeconds ?? 30) * 1000;
        set({ phase: { kind: 'timed_running', targetEpochMs: Date.now() + ms } });
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
        set({
          currentExerciseIndex: nextExerciseIndex,
          currentSetNumber: nextSetNumber,
          phase: { kind: 'exercising' },
          editReps: nextEx.reps ?? 0,
          editWeight: nextEx.weightKg,
        });
      },

      adjustRest: (deltaSeconds) => {
        const { phase } = get();
        if (phase.kind !== 'resting') return;
        const newTarget = Math.max(
          Date.now() + 1000, // minimum 1 second remaining
          phase.restTargetEpochMs + deltaSeconds * 1000,
        );
        set({ phase: { ...phase, restTargetEpochMs: newTarget } });
      },

      skipRest: () => get().onRestEnd(),

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
