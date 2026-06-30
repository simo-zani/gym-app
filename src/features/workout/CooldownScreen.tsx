/**
 * CooldownScreen — 30-second cooldown countdown shown after the last set of a timed/pyramid exercise.
 * The user can skip it by pressing the "Salta" button.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SkipForward } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { useCountdown, formatTime } from './useCountdown';
import { playRestEnd, vibrateRestEnd } from './audio';
import { Button } from '@/components/ui/Button';
import { ExerciseProgressBar } from './ExerciseProgressBar';
import { useElapsedSeconds, formatElapsed } from './useElapsedSeconds';

interface Props {
  onExitRequest: () => void;
}

const COOLDOWN_SECONDS = 30;

export function CooldownScreen({ onExitRequest }: Props) {
  const { t } = useTranslation();
  const {
    exercises,
    currentExerciseIndex,
    currentSetNumber,
    phase,
    startedAtMs,
    currentExerciseStartedAtMs,
    onCooldownEnd,
    skipCooldown,
  } = useWorkoutStore();

  if (phase.kind !== 'cooldown') return null;

  const ex = exercises[currentExerciseIndex];
  if (!ex) return null;

  const handleCooldownEnd = useCallback(() => {
    playRestEnd();
    vibrateRestEnd();
    onCooldownEnd();
  }, [onCooldownEnd]);

  const secondsLeft = useCountdown(true, phase.targetEpochMs, handleCooldownEnd);
  const progress = Math.max(0, Math.min(1, secondsLeft / COOLDOWN_SECONDS));

  // Elapsed timers
  const exerciseElapsed = useElapsedSeconds(currentExerciseStartedAtMs);
  const workoutElapsed = useElapsedSeconds(startedAtMs);

  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-blueSoft/70">
            {t('workout.cooldown')}
          </span>
          <h2 className="mt-0.5 text-lg font-bold text-slate-300">
            {ex.exerciseName}
          </h2>
        </div>
        <button
          onClick={onExitRequest}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-dangerRed transition hover:bg-bg-2 hover:text-red-400"
        >
          {t('workout.exit')}
        </button>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────── */}
      <div className="px-5 pb-3">
        <ExerciseProgressBar
          totalSets={ex.totalSets}
          currentPhase="cooldown"
          currentSet={currentSetNumber}
          currentProgress={1 - progress}
        />
      </div>

      {/* ── Workout elapsed timer (always visible) ────────────── */}
      <div className="flex justify-center gap-6 px-5 pb-2">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('workout.exerciseTime')}</p>
          <p className="text-xs font-bold tabular-nums text-slate-400">{formatElapsed(exerciseElapsed)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('workout.workoutTime')}</p>
          <p className="text-xs font-bold tabular-nums text-slate-400">{formatElapsed(workoutElapsed)}</p>
        </div>
      </div>

      {/* ── Circular cooldown countdown ────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg width="240" height="240" className="-rotate-90">
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="rgba(96,165,250,0.12)"
              strokeWidth="10"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span
              className="text-6xl font-black tabular-nums text-blueSoft"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(secondsLeft)}
            </span>
            <span className="mt-1 text-[11px] font-semibold tabular-nums text-slate-500">
              {formatElapsed(exerciseElapsed)}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-400 text-center px-8">
          {t('workout.cooldownHint')}
        </p>
      </div>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 flex flex-col gap-3 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          id="btn-skip-cooldown"
          variant="success"
          className="flex w-full items-center justify-center gap-2 py-4 text-base font-bold"
          onClick={skipCooldown}
        >
          <SkipForward size={20} />
          {t('workout.skip')}
        </Button>
      </div>
    </div>
  );
}
