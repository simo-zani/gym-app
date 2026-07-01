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

  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  // `progress` is the remaining fraction; offset = C * progress makes the arc
  // fill up clockwise as time elapses (empty at start → full at the end).
  const strokeDashoffset = circumference * progress;

  return (
    <div className="flex min-h-screen flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-500">
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
      <div className="flex flex-1 flex-col">
        <div className="flex-[0.8]" />
        <div className="flex items-center justify-center">
          <div className="relative flex items-center justify-center">
          {/* Ambient phase glow */}
          <div
            aria-hidden
            className="phase-glow pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.32) 0%, rgba(168,85,247,0) 70%)' }}
          />
          <svg width="240" height="240" className="relative z-10 -rotate-90">
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="rgba(168,85,247,0.12)"
              strokeWidth="14"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#a855f7"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}
            />
          </svg>
          <div className="absolute z-10 flex items-center justify-center">
            <span
              className="text-6xl font-black tabular-nums text-purple-500"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>
        </div>
        <div className="flex-[1.2]" />
      </div>

      {/* ── CTA (fixed at bottom) ────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 mx-auto max-w-md flex flex-col gap-3 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          id="btn-skip-cooldown"
          variant="ghost"
          className="flex w-full items-center justify-center gap-2 py-4 text-base font-bold bg-slate-700 hover:bg-slate-600"
          onClick={skipCooldown}
        >
          <SkipForward size={20} />
          {t('workout.skip')}
        </Button>
      </div>
    </div>
  );
}
