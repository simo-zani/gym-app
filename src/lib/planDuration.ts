import type { PyramidSet } from '@/types/db';

/**
 * Shape of a plan exercise item as returned by the usePlans() query.
 * Mirrors the Supabase join result (subset of WorkoutPlanExercise fields).
 */
export interface PlanItemForDuration {
  mode: 'reps' | 'time' | 'pyramid';
  sets: number;
  reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number;
  pyramid_config: PyramidSet[] | null;
}

/** Estimated seconds for a single set.
 *  - reps  → reps × 3 s (≈ 3 seconds per rep, industry standard estimate)
 *  - time  → duration_seconds
 *  - defaults to 30 s if data missing
 */
function setActiveSeconds(item: PlanItemForDuration, setIndex?: number): number {
  if (item.mode === 'time') {
    return item.duration_seconds ?? 30;
  }
  if (item.mode === 'pyramid' && item.pyramid_config) {
    const cfg = item.pyramid_config[setIndex ?? 0];
    if (!cfg) return 30;
    if (cfg.mode === 'time') return cfg.duration_seconds ?? 30;
    return (cfg.reps ?? 10) * 3;
  }
  // reps mode (or pyramid without config)
  return (item.reps ?? 10) * 3;
}

/**
 * Compute the total estimated duration of a plan in **minutes**.
 * Always returns at least 1 minute.
 */
export function computePlanDurationMinutes(items: PlanItemForDuration[]): number {
  let totalSeconds = 0;

  for (const item of items) {
    if (item.sets <= 0) continue;

    let activeSecondsForExercise = 0;
    if (item.mode === 'pyramid' && item.pyramid_config) {
      const configuredSets = item.pyramid_config.length;
      for (let i = 0; i < item.sets; i++) {
        // Fallback to last configured set if sets count exceeds configuration entries
        const idx = Math.min(i, configuredSets - 1);
        activeSecondsForExercise += setActiveSeconds(item, idx);
      }
    } else {
      activeSecondsForExercise = item.sets * setActiveSeconds(item);
    }

    // Rest is only between sets: if sets = 3, we rest 2 times (sets - 1)
    const restsCount = Math.max(0, item.sets - 1);
    const restSecondsForExercise = restsCount * item.rest_seconds;

    totalSeconds += activeSecondsForExercise + restSecondsForExercise;
  }

  return Math.max(1, Math.round(totalSeconds / 60));
}
