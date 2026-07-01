/**
 * ExerciseHubScreen
 *
 * Shown between exercises (after one exercise finishes, before the next begins).
 * Displays the full workout plan with completed exercises ticked off and upcoming
 * exercises listed below, then a CTA to begin resting before the next set.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, X } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { formatTime } from './useCountdown';
import { Button } from '@/components/ui/Button';
import { useElapsedSeconds, formatElapsed } from './useElapsedSeconds';

interface Props {
  onExitRequest: () => void;
}

export function ExerciseHubScreen({ onExitRequest }: Props) {
  const { t } = useTranslation();
  const {
    exercises,
    sets,
    startedAtMs,
    phase,
    planName,
    startNextExerciseAfterHub,
  } = useWorkoutStore();

  // Which exercise row is expanded to reveal its per-set breakdown
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  if (phase.kind !== 'exercise_hub') return null;
  const { nextExerciseIndex } = phase;

  const workoutElapsed = useElapsedSeconds(startedAtMs);

  // Build per-exercise completion maps keyed by planExerciseId (unique even when
  // the same exercise name appears more than once in the plan).
  const setsByExercise: Record<string, number> = {};
  const setResultsByExercise: Record<string, Record<number, (typeof sets)[number]>> = {};
  for (const s of sets) {
    setsByExercise[s.planExerciseId] = (setsByExercise[s.planExerciseId] ?? 0) + 1;
    (setResultsByExercise[s.planExerciseId] ??= {})[s.setNumber] = s;
  }

  return (
    <div className="flex h-[100dvh] flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {planName}
          </span>
          <h1 className="mt-0.5 text-lg font-extrabold text-slate-100">
            {t('workout.exerciseComplete')}
          </h1>
        </div>
        <button
          onClick={onExitRequest}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-dangerRed transition hover:bg-bg-2"
        >
          {t('workout.exit')}
        </button>
      </div>

      {/* ── Workout elapsed ──────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {t('workout.workoutTime')}
        </span>
        <span className="text-sm font-bold tabular-nums text-slate-300">
          {formatElapsed(workoutElapsed)}
        </span>
      </div>

      {/* ── Exercise list ─────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
        {exercises.map((ex, idx) => {
          const setsCompleted = setsByExercise[ex.planExerciseId] ?? 0;
          const isDone = setsCompleted >= ex.totalSets;
          const isNext = idx === nextExerciseIndex;
          const isPast = idx < nextExerciseIndex;
          const isCompleted = isDone || isPast;

          const isExpanded = expandedExercise === ex.planExerciseId;
          const exSetResults = setResultsByExercise[ex.planExerciseId] ?? {};

          return (
            <div
              key={ex.planExerciseId}
              className={`rounded-2xl border transition-all duration-300 ${
                isNext
                  ? 'border-successGreen/40 bg-successGreen/5 shadow-lg shadow-successGreen/5'
                  : isCompleted
                  ? 'border-bg-3/40 bg-bg-1/60'
                  : 'border-bg-3/30 bg-bg-1/40'
              } ${isCompleted && !isExpanded ? 'opacity-70' : ''}`}
            >
              <button
                onClick={() =>
                  setExpandedExercise((prev) =>
                    prev === ex.planExerciseId ? null : ex.planExerciseId
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 size={22} className="text-successGreen" strokeWidth={2} />
                  ) : isNext ? (
                    <ChevronRight size={22} className="text-successGreen" strokeWidth={2.5} />
                  ) : (
                    <Circle size={22} className="text-slate-600" strokeWidth={1.5} />
                  )}
                </div>

                {/* Exercise info */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-semibold leading-tight ${
                      isNext ? 'text-slate-100' : isCompleted ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {ex.exerciseName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {ex.totalSets} {t('workout.setLabel').toLowerCase()}
                    {ex.mode === 'reps' && ex.reps != null ? ` × ${ex.reps}` : ''}
                    {ex.mode === 'time' && ex.durationSeconds != null
                      ? ` × ${ex.durationSeconds}s`
                      : ''}
                    {ex.mode === 'pyramid' ? ` × ${t('exerciseConfig.pyramidMode').toLowerCase()}` : ''}
                    {ex.weightKg != null ? ` · ${ex.weightKg} kg` : ''}
                  </p>
                </div>

                {/* Progress badge */}
                {isNext && (
                  <div className="shrink-0 rounded-full bg-successGreen/15 px-2 py-0.5">
                    <span className="text-[10px] font-bold text-successGreen">
                      {t('workout.upNext').toUpperCase()}
                    </span>
                  </div>
                )}
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Per-set breakdown */}
              {isExpanded && (
                <div className="border-t border-bg-3/40 px-4 py-3 space-y-1.5">
                  {Array.from({ length: ex.totalSets }, (_, i) => i + 1).map((setNum) => {
                    const result = exSetResults[setNum];
                    const isSetDone = !!result && !result.wasSkipped;
                    const isSetSkipped = !!result && result.wasSkipped;

                    // Target for this set (falls back for not-yet-done sets)
                    let tgtReps = ex.mode === 'reps' ? ex.reps : null;
                    let tgtDuration = ex.mode === 'time' ? ex.durationSeconds : null;
                    let tgtWeight = ex.weightKg;
                    if (ex.mode === 'pyramid' && ex.pyramidConfig) {
                      const cfg = ex.pyramidConfig[setNum - 1] ?? ex.pyramidConfig[ex.pyramidConfig.length - 1];
                      if (cfg) {
                        tgtReps = cfg.mode === 'reps' ? (cfg.reps ?? null) : null;
                        tgtDuration = cfg.mode === 'time' ? (cfg.duration_seconds ?? null) : null;
                        tgtWeight = cfg.weight_kg;
                      }
                    }

                    let detail: string;
                    if (result) {
                      if (result.repsDone != null) {
                        detail = `${result.repsDone} ${t('workout.repsShort')}`;
                      } else if (result.durationSecondsDone != null) {
                        detail = formatTime(result.durationSecondsDone);
                      } else {
                        detail = '—';
                      }
                      if (result.weightKg != null) detail += ` · ${result.weightKg} kg`;
                    } else {
                      if (tgtReps != null) {
                        detail = `${tgtReps} ${t('workout.repsShort')}`;
                      } else if (tgtDuration != null) {
                        detail = formatTime(tgtDuration);
                      } else {
                        detail = '—';
                      }
                      if (tgtWeight != null) detail += ` · ${tgtWeight} kg`;
                    }

                    return (
                      <div
                        key={setNum}
                        className="flex items-center gap-2.5 rounded-lg bg-bg-0/40 px-3 py-2"
                      >
                        <div className="shrink-0">
                          {isSetDone ? (
                            <CheckCircle2 size={16} className="text-successGreen" strokeWidth={2} />
                          ) : isSetSkipped ? (
                            <X size={16} className="text-dangerRed" strokeWidth={2.5} />
                          ) : (
                            <Circle size={16} className="text-slate-600" strokeWidth={1.5} />
                          )}
                        </div>
                        <span className={`flex-1 text-xs font-medium ${result ? 'text-slate-300' : 'text-slate-500'}`}>
                          {t('workout.setNumber', { n: setNum })}
                        </span>
                        <span className={`text-xs font-semibold tabular-nums ${
                          isSetSkipped ? 'text-dangerRed' : result ? 'text-slate-200' : 'text-slate-500'
                        }`}>
                          {isSetSkipped ? t('workout.setSkipped') : detail}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 flex flex-col gap-3 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          id="btn-start-next-exercise"
          variant="success"
          className="flex w-full items-center justify-center gap-2 py-4 text-base font-bold"
          onClick={startNextExerciseAfterHub}
        >
          <ChevronRight size={20} />
          {t('workout.startNextExercise')}
        </Button>
      </div>
    </div>
  );
}
