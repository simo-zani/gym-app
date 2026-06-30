-- Add new columns to exercises
alter table exercises add column if not exists description_it text;
alter table exercises add column if not exists is_bodyweight boolean not null default false;
alter table exercises add column if not exists equipment text;

-- Create user_exercise_customizations table for per-user overrides
create table if not exists user_exercise_customizations (
  exercise_id uuid references exercises(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  description text,
  description_it text,
  is_bodyweight boolean,
  equipment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (exercise_id, user_id)
);

create index if not exists user_exercise_customizations_user_idx on user_exercise_customizations(user_id);

-- Enable RLS
alter table user_exercise_customizations enable row level security;

-- Policies for user_exercise_customizations
create policy uec_select on user_exercise_customizations for select
  using (user_id = auth.uid());

create policy uec_insert on user_exercise_customizations for insert
  with check (user_id = auth.uid());

create policy uec_update on user_exercise_customizations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy uec_delete on user_exercise_customizations for delete
  using (user_id = auth.uid());

-- Trigger to update updated_at
create trigger trg_uec_updated before update on user_exercise_customizations
  for each row execute function set_updated_at();
