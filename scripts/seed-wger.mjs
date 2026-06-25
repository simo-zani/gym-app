// =============================================================
// Seed del catalogo esercizi da wger.de — da lanciare UNA TANTUM.
//
// Gli esercizi importati sono globali (owner_id = null, source = 'wger').
// La policy RLS di insert su `exercises` richiede owner_id = auth.uid(),
// perciò questo script usa la SERVICE ROLE KEY (che bypassa RLS).
// La service role key NON va mai messa nel client né committata.
//
// Uso:
//   node --env-file=.env scripts/seed-wger.mjs
// dove .env contiene:
//   VITE_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings → API → service_role)
//
// È idempotente: rilanciarlo aggiorna gli esercizi esistenti (match su
// external_id) invece di duplicarli — vedi indice exercises_wger_unique.
// =============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Mancano VITE_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Lancia con: node --env-file=.env scripts/seed-wger.mjs',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// wger category name → nostro muscle_group
const CATEGORY_MAP = {
  Abs: 'core',
  Arms: 'arms',
  Back: 'back',
  Calves: 'legs',
  Cardio: 'cardio',
  Chest: 'chest',
  Legs: 'legs',
  Shoulders: 'shoulders',
};

const WGER_BASE = 'https://wger.de/api/v2';
const ENGLISH = 2; // language id

function stripHtml(html) {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

async function fetchAllExercises() {
  const all = [];
  let url = `${WGER_BASE}/exerciseinfo/?language=${ENGLISH}&limit=100&offset=0`;
  while (url) {
    process.stdout.write(`Fetching ${url}\n`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`wger HTTP ${res.status}`);
    const json = await res.json();
    all.push(...json.results);
    url = json.next;
  }
  return all;
}

function mapExercise(item) {
  const translation =
    item.translations?.find((t) => t.language === ENGLISH) ?? item.translations?.[0];
  const name = translation?.name?.trim();
  if (!name) return null; // skip exercises without a usable name

  const muscleGroup = CATEGORY_MAP[item.category?.name] ?? 'other';

  return {
    name,
    description: stripHtml(translation?.description),
    muscle_group: muscleGroup,
    source: 'wger',
    external_id: String(item.id),
    owner_id: null,
  };
}

async function upsertBatched(rows, conflictColumn) {
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('exercises')
      .upsert(batch, { onConflict: conflictColumn, ignoreDuplicates: false });
    if (error) throw error;
  }
}

async function insertBatched(rows) {
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('exercises').insert(batch);
    if (error) throw error;
  }
}

async function main() {
  const raw = await fetchAllExercises();
  console.log(`\nScaricati ${raw.length} esercizi da wger.`);

  // Dedup per external_id e scarta i non mappabili.
  const byExternalId = new Map();
  for (const item of raw) {
    const mapped = mapExercise(item);
    if (mapped) byExternalId.set(mapped.external_id, mapped);
  }
  const rows = [...byExternalId.values()];
  console.log(`${rows.length} esercizi mappati.`);

  // Partiziona in nuovi vs già presenti (match su external_id) per essere
  // idempotenti senza dipendere dall'inferenza dell'indice parziale wger.
  const { data: existing, error: exErr } = await supabase
    .from('exercises')
    .select('id, external_id')
    .eq('source', 'wger');
  if (exErr) throw exErr;

  const existingByExternalId = new Map((existing ?? []).map((e) => [e.external_id, e.id]));

  const toInsert = rows.filter((r) => !existingByExternalId.has(r.external_id));
  const toUpdate = rows
    .filter((r) => existingByExternalId.has(r.external_id))
    .map((r) => ({ ...r, id: existingByExternalId.get(r.external_id) }));

  console.log(`Nuovi: ${toInsert.length} · Da aggiornare: ${toUpdate.length}`);

  await insertBatched(toInsert);
  // Update tramite upsert sulla primary key (indice non parziale → inferenza ok).
  await upsertBatched(toUpdate, 'id');

  console.log(
    `\n✅ Seed completato: ${toInsert.length} inseriti, ${toUpdate.length} aggiornati.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
