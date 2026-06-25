// Domain types mirroring the Postgres schema (supabase/migrations/0001_init.sql).
// Kept hand-written (no generated types yet) to stay simple.

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'other';

export type ExerciseSource = 'wger' | 'custom';

export type ExerciseMode = 'reps' | 'time';

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscle_group: MuscleGroup | null;
  source: ExerciseSource;
  external_id: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanExercise {
  id: string;
  plan_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  mode: ExerciseMode;
  reps: number | null;
  duration_seconds: number | null;
  weight_kg: number | null;
  rest_seconds: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Row of workout_plan_exercises joined with its exercise (for the plan editor).
export interface PlanExerciseWithExercise extends WorkoutPlanExercise {
  exercise: Pick<Exercise, 'id' | 'name' | 'muscle_group'> | null;
}
