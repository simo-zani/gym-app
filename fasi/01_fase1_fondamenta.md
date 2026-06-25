# Fase 1 — Fondamenta

> Obiettivo: avere un'app React deployata su Vercel, con login Supabase funzionante, schema DB completo su Postgres, RLS attiva. Niente UI ancora, solo "scheletro" che gira end-to-end.

## Deliverable

- [ ] Repo Git inizializzato + collegato a GitHub
- [ ] Progetto Vite + React 18 + TypeScript con Tailwind
- [ ] Routing base (login / home protetta)
- [ ] Supabase project creato, auth email/password funzionante (confirm disabilitata come in finanze)
- [ ] Schema DB applicato (vedi sotto)
- [ ] RLS attiva su tutte le tabelle user-scoped
- [ ] Deploy automatico su Vercel da `main`
- [ ] Variabili d'ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) configurate in Vercel

## Struttura cartelle iniziale

```
src/
  components/
    ui/                   # primitive (Button, Input, Modal, ecc.)
    layout/               # AppShell, BottomNav
  features/
    auth/                 # Login.tsx, useAuth hook
  lib/
    supabase.ts           # client supabase
    queryClient.ts        # tanstack query
  pages/
    LoginPage.tsx
    HomePage.tsx          # placeholder per ora
  routes/
    AppRoutes.tsx
    ProtectedRoute.tsx
  styles/
    index.css
  App.tsx
  main.tsx
supabase/
  migrations/
    0001_init.sql         # schema completo
```

## Schema database

> Nota: tutte le tabelle hanno `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`. Il trigger `updated_at` va aggiunto a tutte.

### `exercises` — catalogo esercizi

```sql
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  muscle_group text,                          -- 'chest','back','legs','shoulders','arms','core','cardio','other'
  source text not null default 'custom',       -- 'wger' | 'custom'
  external_id text,                            -- id wger se applicabile
  owner_id uuid references auth.users(id) on delete cascade,
                                              -- null = esercizio globale (seed wger)
                                              -- non-null = esercizio creato dall'utente
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_owner_idx on exercises(owner_id);
create index exercises_muscle_idx on exercises(muscle_group);
```

**RLS:** un utente vede `where owner_id is null or owner_id = auth.uid()`. Insert/update/delete solo se `owner_id = auth.uid()`.

### `workout_plans` — schede

```sql
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
```

**RLS:** classica `user_id = auth.uid()` per select/insert/update/delete.

### `workout_plan_exercises` — esercizi dentro una scheda

```sql
create table workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references workout_plans(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position integer not null,                   -- ordine nella scheda
  sets integer not null default 3,
  mode text not null default 'reps',           -- 'reps' | 'time'
  reps integer,                                -- se mode='reps'
  duration_seconds integer,                    -- se mode='time'
  weight_kg numeric(6,2),                      -- nullable
  rest_seconds integer not null default 60,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((mode='reps' and reps is not null) or (mode='time' and duration_seconds is not null))
);

create index wpe_plan_idx on workout_plan_exercises(plan_id, position);
```

**RLS:** join con `workout_plans` per controllare ownership. Policy:
```sql
create policy wpe_select on workout_plan_exercises for select
  using (exists (select 1 from workout_plans p where p.id = plan_id and p.user_id = auth.uid()));
-- analoghe per insert/update/delete
```

### `workout_sessions` — storico allenamenti

```sql
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references workout_plans(id) on delete set null,
  plan_name_snapshot text,                     -- nome scheda al momento dell'allenamento
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sessions_user_started_idx on workout_sessions(user_id, started_at desc);
```

### `workout_session_sets` — set eseguiti per sessione

```sql
create table workout_session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  exercise_name_snapshot text not null,         -- snapshot nome esercizio
  set_number integer not null,
  mode text not null,                          -- 'reps' | 'time'
  reps_done integer,
  duration_seconds_done integer,
  weight_kg numeric(6,2),
  rest_seconds_taken integer,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index session_sets_session_idx on workout_session_sets(session_id);
```

> Gli `*_snapshot` servono perché se cambi nome a una scheda o cancelli un esercizio, lo storico resta leggibile.

## Trigger updated_at riutilizzabile

```sql
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- esempio
create trigger trg_exercises_updated before update on exercises
  for each row execute function set_updated_at();
-- ripetere per tutte le tabelle con updated_at
```

## Dipendenze npm da installare

```bash
# core
npm i react react-dom react-router-dom
npm i @supabase/supabase-js
npm i @tanstack/react-query
npm i zod                 # validazione form
npm i react-hook-form @hookform/resolvers

# styling
npm i -D tailwindcss postcss autoprefixer
npm i lucide-react        # icone

# dev / types
npm i -D typescript @types/react @types/react-dom
npm i -D @vitejs/plugin-react vite
```

## Configurazioni base

### `tailwind.config.js` — palette del mockup

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { 0: '#060b1a', 1: '#0a1228', 2: '#121d3d', 3: '#1a2a52' },
        blueGlow: '#3b82f6',
        blueSoft: '#60a5fa',
        successGreen: '#10b981',
        dangerRed: '#ef4444',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
};
```

### `src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing Supabase env vars');
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
```

### Disabilitare email confirmation

In Supabase dashboard → Authentication → Email Templates → disattiva "Confirm signup" (come fatto in finanze).

## Checklist completamento Fase 1

- [ ] `npm run dev` apre l'app, login funziona
- [ ] Dopo login si arriva a `HomePage` (anche se è solo "Hello {email}")
- [ ] Logout funziona
- [ ] Schema applicato su Supabase, RLS abilitata
- [ ] Provato manualmente in SQL editor: un utente NON vede dati di un altro utente
- [ ] Push su GitHub → Vercel builda e deploya
- [ ] App in produzione raggiungibile via HTTPS

## Cosa NON facciamo in questa fase

- ❌ CRUD esercizi e schede → Fase 2
- ❌ Modalità workout → Fase 3
- ❌ Offline / PWA → Fase 4
- ❌ Design rifinito → arriva gradualmente nelle fasi 2-3

## Note per Claude Code

- Riusa la struttura di setup Supabase del progetto finanze se ce l'hai sotto mano
- Non installare ancora `dexie` né `vite-plugin-pwa` — arrivano in Fase 4
- Per il deploy Vercel: collega il repo GitHub, framework "Vite", aggiungi le 2 env var
- Genera l'SQL della migrazione come singolo file `supabase/migrations/0001_init.sql` da incollare nel SQL Editor di Supabase
