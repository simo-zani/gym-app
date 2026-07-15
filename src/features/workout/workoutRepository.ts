/**
 * Workout repository — offline-first (Phase 4).
 *
 * Every write lands in Dexie first (marked `_dirty`) and enqueues an outbox op;
 * the sync engine flushes the outbox to Supabase when online. This is the path
 * that must survive a gym with no signal, so it never awaits the network.
 *
 * The public interface is unchanged from Phase 3, so the workout UI components
 * did not need to change.
 */

import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { runSync } from '@/lib/sync';
import type { ExerciseMode } from '@/types/db';

export interface CreateSessionParams {
  planId: string;
  planName: string;
}

export interface SaveSetParams {
  sessionId: string;
  planExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  mode: ExerciseMode;
  repsDone: number | null;
  durationSecondsDone: number | null;
  weightKg: number | null;
}

/** Reads the user id from the persisted session (no network — works offline). */
async function offlineUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) throw new Error('Utente non autenticato');
  return userId;
}

export const workoutRepository = {
  /** Creates a new workout session locally and returns its id. */
  async createSession({ planId, planName }: CreateSessionParams): Promise<string> {
    const userId = await offlineUserId();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const payload = {
      id,
      user_id: userId,
      plan_id: planId,
      plan_name_snapshot: planName,
      started_at: now,
    };

    await db.transaction('rw', db.workout_sessions, db.outbox, async () => {
      await db.workout_sessions.put({
        ...payload,
        ended_at: null,
        completed_at: null,
        rating: null,
        notes: null,
        created_at: now,
        updated_at: now,
        _dirty: 1,
      });
      await db.outbox.add({
        entity: 'workout_sessions',
        op: 'insert',
        rowId: id,
        payload,
        createdAt: now,
        attempts: 0,
      });
    });

    void runSync();
    return id;
  },

  /** Records a single completed set locally. */
  async saveSet({
    sessionId,
    planExerciseId: _planExerciseId,
    exerciseId,
    exerciseName,
    setNumber,
    mode,
    repsDone,
    durationSecondsDone,
    weightKg,
  }: SaveSetParams): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const payload = {
      id,
      session_id: sessionId,
      exercise_id: exerciseId,
      exercise_name_snapshot: exerciseName,
      set_number: setNumber,
      mode,
      reps_done: mode === 'reps' ? repsDone : null,
      duration_seconds_done: mode === 'time' ? durationSecondsDone : null,
      weight_kg: weightKg,
      rest_seconds_taken: null,
      completed_at: now,
    };

    await db.transaction('rw', db.workout_session_sets, db.outbox, async () => {
      await db.workout_session_sets.put({
        ...payload,
        created_at: now,
        _dirty: 1,
      });
      await db.outbox.add({
        entity: 'workout_session_sets',
        op: 'insert',
        rowId: id,
        payload,
        createdAt: now,
        attempts: 0,
      });
    });

    void runSync();
  },

  /**
   * Marks the session finished. When `completed` is true (finished from the
   * summary screen) it also stamps `completed_at` and the subjective `rating`.
   */
  async finishSession(
    sessionId: string,
    opts?: { notes?: string; rating?: number | null; completed?: boolean },
  ): Promise<void> {
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      ended_at: now,
      notes: opts?.notes?.trim() || null,
    };
    if (opts?.completed) {
      patch.completed_at = now;
      patch.rating = opts.rating ?? null;
    }

    await db.transaction('rw', db.workout_sessions, db.outbox, async () => {
      await db.workout_sessions.update(sessionId, {
        ...patch,
        updated_at: now,
        _dirty: 1,
      });
      await db.outbox.add({
        entity: 'workout_sessions',
        op: 'update',
        rowId: sessionId,
        payload: patch,
        createdAt: now,
        attempts: 0,
      });
    });

    void runSync();
  },
};
