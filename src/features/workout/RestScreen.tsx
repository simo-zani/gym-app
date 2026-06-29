import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SkipForward } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { useCountdown, formatTime } from './useCountdown';
import { playRestEnd, vibrateRestEnd } from './audio';
import { Button } from '@/components/ui/Button';

interface Props {
  onExitRequest: () => void;
}

export function RestScreen({ onExitRequest }: Props) {
  const { t } = useTranslation();
  const {
    exercises,
    phase,
    onRestEnd,
    adjustRest,
    skipRest,
  } = useWorkoutStore();

  if (phase.kind !== 'resting') return null;

  const { restTargetEpochMs, nextExerciseIndex, nextSetNumber } = phase;
  const nextEx = exercises[nextExerciseIndex];

  const handleRestEnd = useCallback(() => {
    playRestEnd();
    vibrateRestEnd();
    onRestEnd();
  }, [onRestEnd]);

  const secondsLeft = useCountdown(true, restTargetEpochMs, handleRestEnd);

  // Determine progress for the ring animation
  const totalRest = exercises[nextExerciseIndex - 1 >= 0
    ? nextSetNumber === 1 ? nextExerciseIndex - 1 : nextExerciseIndex
    : nextExerciseIndex]?.restSeconds ?? 60;
  const progress = Math.max(0, Math.min(1, secondsLeft / totalRest));

  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-successGreen/70">
            {t('workout.rest')}
          </span>
          <h2 className="mt-0.5 text-lg font-bold text-slate-300">
            {nextSetNumber === 1
              ? t('workout.nextExercise')
              : t('workout.nextSet', { set: nextSetNumber })}
            :&nbsp;
            <span className="text-slate-100">{nextEx?.exerciseName}</span>
          </h2>
        </div>
        <button
          onClick={onExitRequest}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-bg-2 hover:text-dangerRed"
        >
          {t('workout.exit')}
        </button>
      </div>

      {/* ── Circular timer ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg width="144" height="144" className="-rotate-90">
            {/* Track */}
            <circle
              cx="72"
              cy="72"
              r="54"
              fill="none"
              stroke="rgba(16,185,129,0.12)"
              strokeWidth="8"
            />
            {/* Progress */}
            <circle
              cx="72"
              cy="72"
              r="54"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}
            />
          </svg>
          <span
            className="absolute text-5xl font-black tabular-nums text-successGreen"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>

        {/* Next set info */}
        {nextEx && (
          <div className="mx-5 rounded-2xl border border-bg-3 bg-bg-1 px-5 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
              {t('workout.upNext')}
            </p>
            <p className="font-bold text-slate-200">{nextEx.exerciseName}</p>
            <p className="text-sm text-slate-400 mt-0.5">
              {t('workout.setOf', { current: nextSetNumber, total: nextEx.totalSets })}
              {nextEx.mode === 'reps' && nextEx.reps != null
                ? ` · ${nextEx.reps} ${t('workout.repsLabel').toLowerCase()}`
                : ''}
              {nextEx.weightKg != null
                ? ` · ${nextEx.weightKg} kg`
                : nextEx.mode === 'reps'
                  ? ` · ${t('workout.bodyweight').toLowerCase()}`
                  : ''}
            </p>
          </div>
        )}
      </div>

      {/* ── Controls ───────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 flex flex-col gap-3 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {/* ±15s buttons */}
        <div className="flex gap-3">
          <button
            id="rest-minus15"
            onClick={() => adjustRest(-15)}
            className="flex-1 rounded-xl bg-bg-2 py-3 text-sm font-bold text-slate-300 transition hover:bg-bg-3 active:scale-95"
          >
            −15s
          </button>
          <button
            id="rest-plus15"
            onClick={() => adjustRest(15)}
            className="flex-1 rounded-xl bg-bg-2 py-3 text-sm font-bold text-slate-300 transition hover:bg-bg-3 active:scale-95"
          >
            +15s
          </button>
        </div>

        {/* Skip */}
        <Button
          id="btn-skip-rest"
          variant="success"
          className="flex w-full items-center justify-center gap-2 py-4 text-base font-bold"
          onClick={skipRest}
        >
          <SkipForward size={20} />
          {t('workout.skip')}
        </Button>
      </div>
    </div>
  );
}
