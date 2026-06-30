-- Add difficulty column to workout_plans
alter table workout_plans add column if not exists difficulty integer not null default 3;
