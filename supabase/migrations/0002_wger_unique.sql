-- =============================================================
-- GymApp — Fase 2 — Indice univoco per il seed wger
-- Da incollare ed eseguire nel SQL Editor di Supabase dopo 0001_init.sql.
-- Serve a rendere idempotente l'import del catalogo wger:
-- l'upsert usa external_id come conflict key, così rilanciare il seed
-- aggiorna gli esercizi esistenti invece di duplicarli.
-- =============================================================

-- Indice univoco parziale: vincola external_id solo per gli esercizi wger.
-- Gli esercizi custom (source='custom') hanno external_id null e non sono toccati.
create unique index if not exists exercises_wger_unique
  on exercises (external_id)
  where source = 'wger';
