/**
 * ExerciseHubScreen
 *
 * Shown between exercises (after one exercise finishes, before the next begins).
 * Displays the full workout plan with completed exercises ticked off and upcoming
 * exercises listed below, then a CTA to begin resting before the next set.
 */
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, ChevronRight, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
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

  if (phase.kind !== 'exercise_hub') return null;
  const { nextExerciseIndex } = phase;
  const nextEx = exercises[nextExerciseIndex];

  const workoutElapsed = useElapsedSeconds(startedAtMs);

  // Build per-exercise completion map: exerciseName -> sets completed
  const setsByExercise: Record<string, number> = {};
  for (const s of sets) {
    setsByExercise[s.exerciseName] = (setsByExercise[s.exerciseName] ?? 0) + 1;
  }

  return (
    <div className="flex min-h-full flex-col">
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
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
        {exercises.map((ex, idx) => {
          const setsCompleted = setsByExercise[ex.exerciseName] ?? 0;
          const isDone = setsCompleted >= ex.totalSets;
          const isNext = idx === nextExerciseIndex;
          const isPast = idx < nextExerciseIndex;

          return (
            <div
              key={ex.planExerciseId}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all duration-300 ${
                isNext
                  ? 'border-successGreen/40 bg-successGreen/5 shadow-lg shadow-successGreen/5'
                  : isDone || isPast
                  ? 'border-bg-3/40 bg-bg-1/60 opacity-70'
                  : 'border-bg-3/30 bg-bg-1/40'
              }`}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isDone || isPast ? (
                  <CheckCircle2
                    size={22}
                    className="text-successGreen"
                    strokeWidth={2}
                  />
                ) : isNext ? (
                  <ChevronRight
                    size={22}
                    className="text-successGreen"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Circle size={22} className="text-slate-600" strokeWidth={1.5} />
                )}
              </div>

              {/* Exercise info */}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-semibold leading-tight ${
                    isNext ? 'text-slate-100' : isDone || isPast ? 'text-slate-400 line-through' : 'text-slate-400'
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
                  {ex.mode === 'pyramid' ? ` × ${t('plans.pyramidal').toLowerCase()}` : ''}
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
              {(isDone || isPast) && (
                <div className="shrink-0">
                  <Dumbbell size={14} className="text-slate-600" />
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
        {nextEx && (
          <div className="mb-1 text-center">
            <p className="text-xs text-slate-500">
              {t('workout.nextExercise')}:{' '}
              <span className="font-semibold text-slate-300">{nextEx.exerciseName}</span>
            </p>
          </div>
        )}
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
