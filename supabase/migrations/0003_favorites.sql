-- =============================================================
-- GymApp — Fase 3/PWA — Preferiti
-- Da eseguire nel SQL Editor di Supabase.
-- =============================================================

ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Indice per migliorare le performance di ordinamento
CREATE INDEX IF NOT EXISTS workout_plans_favorite_idx ON workout_plans(user_id, is_favorite);
