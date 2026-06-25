import type { WorkoutPlanExercise } from '@/types/db';

/**
 * Compact one-line summary of a plan exercise config, e.g.
 *  "4 × 10 · 60 kg · rec 90s"  or  "3 × 45\" · corpo libero · rec 30s".
 */
export function formatPlanExercise(pe: WorkoutPlanExercise): string {
  const parts: string[] = [];

  if (pe.mode === 'time') {
    parts.push(`${pe.sets} × ${pe.duration_seconds ?? 0}"`);
  } else {
    parts.push(`${pe.sets} × ${pe.reps ?? 0}`);
  }

  parts.push(pe.weight_kg != null ? `${pe.weight_kg} kg` : 'corpo libero');
  parts.push(`rec ${pe.rest_seconds}s`);

  return parts.join(' · ');
}
