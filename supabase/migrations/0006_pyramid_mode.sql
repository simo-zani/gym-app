-- Remove old check constraint (Postgres names the anonymous constraint 'workout_plan_exercises_check')
alter table workout_plan_exercises
  drop constraint if exists workout_plan_exercises_check;

-- Remove the previously created custom constraint if any
alter table workout_plan_exercises
  drop constraint if exists workout_plan_exercises_mode_check;

-- Add updated constraint that also allows 'pyramid' and checks reps/duration accordingly
alter table workout_plan_exercises
  add constraint workout_plan_exercises_mode_check
  check (
    (mode = 'reps' and reps is not null) or
    (mode = 'time' and duration_seconds is not null) or
    (mode = 'pyramid')
  );

-- Per-set pyramid configuration (array of {set_number, mode, reps, duration_seconds, weight_kg})
alter table workout_plan_exercises
  add column if not exists pyramid_config jsonb;
