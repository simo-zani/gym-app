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

export type ExerciseMode = 'reps' | 'time' | 'pyramid';

/** One set in a pyramid exercise — each set can have its own mode, reps, duration and weight. */
export interface PyramidSet {
  set_number: number;            // 1-based
  mode: 'reps' | 'time';        // per-set mode (independent from parent)
  reps: number | null;           // used when mode === 'reps'
  duration_seconds: number | null; // used when mode === 'time'
  weight_kg: number | null;      // null = bodyweight
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  description_it: string | null;
  muscle_group: MuscleGroup | null;
  source: ExerciseSource;
  is_bodyweight: boolean;
  equipment: string | null;
  external_id: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserExerciseCustomization {
  exercise_id: string;
  user_id: string;
  description: string | null;
  description_it: string | null;
  is_bodyweight: boolean | null;
  equipment: string | null;
  created_at: string;
  updated_at: string;
}


export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  is_archived: boolean;
  is_favorite: boolean;
  difficulty: number;
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
  /** Populated only when mode === 'pyramid'. Null otherwise. */
  pyramid_config: PyramidSet[] | null;
  created_at: string;
  updated_at: string;
}

// Row of workout_plan_exercises joined with its exercise (for the plan editor).
export interface PlanExerciseWithExercise extends WorkoutPlanExercise {
  exercise: Pick<Exercise, 'id' | 'name' | 'muscle_group'> | null;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_name_snapshot: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionSet {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_name_snapshot: string;
  set_number: number;
  mode: ExerciseMode;
  reps_done: number | null;
  duration_seconds_done: number | null;
  weight_kg: number | null;
  rest_seconds_taken: number | null;
  completed_at: string;
  created_at: string;
}
