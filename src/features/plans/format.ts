import type { WorkoutPlanExercise } from '@/types/db';

/**
 * Compact one-line summary of a plan exercise config, e.g.
 *  "4 × 10 · 60 kg · rec 90s", "3 × 45\" · corpo libero · rec 30s", or "4 × Piramidale · 10-30 kg · rec 60s".
 */
export function formatPlanExercise(pe: WorkoutPlanExercise): string {
  const parts: string[] = [];

  if (pe.mode === 'time') {
    parts.push(`${pe.sets} × ${pe.duration_seconds ?? 0}"`);
    parts.push(pe.weight_kg != null ? `${pe.weight_kg} kg` : 'corpo libero');
  } else if (pe.mode === 'pyramid') {
    parts.push(`${pe.sets} × Piramidale`);

    // Check weights inside pyramid_config
    const weights = pe.pyramid_config?.map(s => s.weight_kg).filter((w): w is number => w !== null && w > 0) ?? [];
    if (weights.length > 0) {
      const minW = Math.min(...weights);
      const maxW = Math.max(...weights);
      if (minW === maxW) {
        parts.push(`${minW} kg`);
      } else {
        parts.push(`${minW}-${maxW} kg`);
      }
    } else {
      parts.push('corpo libero');
    }
  } else {
    parts.push(`${pe.sets} × ${pe.reps ?? 0}`);
    parts.push(pe.weight_kg != null ? `${pe.weight_kg} kg` : 'corpo libero');
  }

  parts.push(`rec ${pe.rest_seconds}s`);

  return parts.join(' · ');
}
