/**
 * Workout repository — isolates all Supabase calls for workout sessions and sets.
 *
 * In Phase 4 this file will be replaced with an offline-first implementation
 * (Dexie outbox + sync) without touching the components.
 */

import { supabase } from '@/lib/supabase';
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

export const workoutRepository = {
  /** Creates a new workout_session row and returns its id. */
  async createSession({ planId, planName }: CreateSessionParams): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error('Utente non autenticato');

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_name_snapshot: planName,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return (data as { id: string }).id;
  },

  /** Inserts a single completed set into workout_session_sets. */
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
    const { error } = await supabase.from('workout_session_sets').insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      exercise_name_snapshot: exerciseName,
      set_number: setNumber,
      mode,
      reps_done: mode === 'reps' ? repsDone : null,
      duration_seconds_done: mode === 'time' ? durationSecondsDone : null,
      weight_kg: weightKg,
      completed_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  /**
   * Marks the session as finished (ended_at). When `completed` is true (the user
   * finished from the summary screen) it also stamps `completed_at` and stores
   * the optional subjective `rating` (1..5).
   */
  async finishSession(
    sessionId: string,
    opts?: { notes?: string; rating?: number | null; completed?: boolean },
  ): Promise<void> {
    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      ended_at: now,
      notes: opts?.notes?.trim() || null,
    };
    if (opts?.completed) {
      update.completed_at = now;
      update.rating = opts.rating ?? null;
    }

    const { error } = await supabase
      .from('workout_sessions')
      .update(update)
      .eq('id', sessionId);
    if (error) throw error;
  },
};
