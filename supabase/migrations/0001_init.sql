-- =============================================================
-- GymApp — Fase 1 — Schema iniziale
-- Da incollare ed eseguire nel SQL Editor di Supabase.
-- Convenzioni: snake_case, RLS attiva su tutte le tabelle user-scoped.
-- =============================================================

-- gen_random_uuid() è disponibile via estensione pgcrypto su Supabase.
create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- Trigger riutilizzabile: aggiorna updated_at ad ogni UPDATE
-- -------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =============================================================
-- exercises — catalogo esercizi (globali wger + custom utente)
-- =============================================================
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  muscle_group text,                            -- 'chest','back','legs','shoulders','arms','core','cardio','other'
  source text not null default 'custom',        -- 'wger' | 'custom'
  external_id text,                             -- id wger se applicabile
  owner_id uuid references auth.users(id) on delete cascade,
                                                -- null = esercizio globale (seed wger)
                                                -- non-null = esercizio creato dall'utente
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_owner_idx on exercises(owner_id);
create index exercises_muscle_idx on exercises(muscle_group);

create trigger trg_exercises_updated before update on exercises
  for each row execute function set_updated_at();

alter table exercises enable row level security;

-- Vede esercizi globali (owner_id null) + i propri
create policy exercises_select on exercises for select
  using (owner_id is null or owner_id = auth.uid());

-- Può creare solo esercizi propri
create policy exercises_insert on exercises for insert
  with check (owner_id = auth.uid());

-- Può modificare solo i propri
create policy exercises_update on exercises for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Può cancellare solo i propri
create policy exercises_delete on exercises for delete
  using (owner_id = auth.uid());

-- =============================================================
-- workout_plans — schede
-- =============================================================
create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_plans_user_idx on workout_plans(user_id);

create trigger trg_workout_plans_updated before update on workout_plans
  for each row execute function set_updated_at();

alter table workout_plans enable row level security;

create policy workout_plans_select on workout_plans for select
  using (user_id = auth.uid());
create policy workout_plans_insert on workout_plans for insert
  with check (user_id = auth.uid());
create policy workout_plans_update on workout_plans for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy workout_plans_delete on workout_plans for delete
  using (user_id = auth.uid());

-- =============================================================
-- workout_plan_exercises — esercizi dentro una scheda
-- =============================================================
create table workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references workout_plans(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position integer not null,                    -- ordine nella scheda
  sets integer not null default 3,
  mode text not null default 'reps',            -- 'reps' | 'time'
  reps integer,                                 -- se mode='reps'
  duration_seconds integer,                     -- se mode='time'
  weight_kg numeric(6,2),                       -- nullable
  rest_seconds integer not null default 60,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((mode = 'reps' and reps is not null) or (mode = 'time' and duration_seconds is not null))
);

create index wpe_plan_idx on workout_plan_exercises(plan_id, position);

create trigger trg_wpe_updated before update on workout_plan_exercises
  for each row execute function set_updated_at();

alter table workout_plan_exercises enable row level security;

-- Ownership controllata via join sulla scheda padre
create policy wpe_select on workout_plan_exercises for select
  using (exists (
    select 1 from workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));
create policy wpe_insert on workout_plan_exercises for insert
  with check (exists (
    select 1 from workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));
create policy wpe_update on workout_plan_exercises for update
  using (exists (
    select 1 from workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));
create policy wpe_delete on workout_plan_exercises for delete
  using (exists (
    select 1 from workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));

-- =============================================================
-- workout_sessions — storico allenamenti
-- =============================================================
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references workout_plans(id) on delete set null,
  plan_name_snapshot text,                      -- nome scheda al momento dell'allenamento
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sessions_user_started_idx on workout_sessions(user_id, started_at desc);

create trigger trg_workout_sessions_updated before update on workout_sessions
  for each row execute function set_updated_at();

alter table workout_sessions enable row level security;

create policy workout_sessions_select on workout_sessions for select
  using (user_id = auth.uid());
create policy workout_sessions_insert on workout_sessions for insert
  with check (user_id = auth.uid());
create policy workout_sessions_update on workout_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy workout_sessions_delete on workout_sessions for delete
  using (user_id = auth.uid());

-- =============================================================
-- workout_session_sets — set eseguiti per sessione
-- =============================================================
create table workout_session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  exercise_name_snapshot text not null,         -- snapshot nome esercizio
  set_number integer not null,
  mode text not null,                           -- 'reps' | 'time'
  reps_done integer,
  duration_seconds_done integer,
  weight_kg numeric(6,2),
  rest_seconds_taken integer,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index session_sets_session_idx on workout_session_sets(session_id);

alter table workout_session_sets enable row level security;

-- Ownership controllata via join sulla sessione padre
create policy wss_select on workout_session_sets for select
  using (exists (
    select 1 from workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
create policy wss_insert on workout_session_sets for insert
  with check (exists (
    select 1 from workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
create policy wss_update on workout_session_sets for update
  using (exists (
    select 1 from workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
create policy wss_delete on workout_session_sets for delete
  using (exists (
    select 1 from workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
