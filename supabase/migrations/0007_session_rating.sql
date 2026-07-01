-- Add a subjective post-workout rating (1..5) and an explicit completion
-- timestamp to workout sessions.
--
-- `ended_at` is written whenever a session ends (including early exit), whereas
-- `completed_at` is set only when the user finishes the workout from the summary
-- screen — i.e. it marks a genuinely completed plan.

alter table workout_sessions
  add column if not exists rating smallint check (rating between 1 and 5);

alter table workout_sessions
  add column if not exists completed_at timestamptz;
