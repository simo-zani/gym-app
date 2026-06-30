import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Square, Pause } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { useCountdown, formatTime } from './useCountdown';
import { playTimedEnd } from './audio';
import { Button } from '@/components/ui/Button';
import { ExerciseProgressBar } from './ExerciseProgressBar';
import { useElapsedSeconds, formatElapsed } from './useElapsedSeconds';

interface Props {
  onExitRequest: () => void;
}

export function TimedExerciseScreen({ onExitRequest }: Props) {
  const { t } = useTranslation();
  const {
    exercises,
    currentExerciseIndex,
    currentSetNumber,
    phase,
    saving,
    startedAtMs,
    currentExerciseStartedAtMs,
    startTimedExercise,
    onTimedEnd,
    completeCurrentSet,
    togglePause,
  } = useWorkoutStore();

  const ex = exercises[currentExerciseIndex];
  if (!ex) return null;

  const isRunning = phase.kind === 'timed_running';
  const isPaused = phase.kind === 'timed_running' ? !!phase.isPaused : false;
  const pausedSecondsLeft = phase.kind === 'timed_running' ? phase.pausedSecondsLeft : undefined;
  const targetEpochMs = phase.kind === 'timed_running' ? phase.targetEpochMs : null;

  const handleTimerEnd = useCallback(async () => {
    playTimedEnd();
    await onTimedEnd();
  }, [onTimedEnd]);

  const secondsLeft = useCountdown(
    isRunning,
    targetEpochMs,
    handleTimerEnd,
    isPaused,
    pausedSecondsLeft
  );

  // Calculate target duration for the circular timer
  const totalDuration = ex.mode === 'pyramid' && ex.pyramidConfig
    ? (ex.pyramidConfig[currentSetNumber - 1]?.duration_seconds ?? 30)
    : (ex.durationSeconds ?? 30);

  const displaySeconds = isPaused
    ? (pausedSecondsLeft ?? 0)
    : (isRunning ? secondsLeft : totalDuration);

  const progress = isRunning || isPaused
    ? Math.max(0, Math.min(1, displaySeconds / totalDuration))
    : 1;

  const radius = 96;
  const circumference = 2 * Math.PI * radius; // 603.185
  const strokeDashoffset = circumference * (1 - progress);

  // Elapsed timers
  const exerciseElapsed = useElapsedSeconds(currentExerciseStartedAtMs);
  const workoutElapsed = useElapsedSeconds(startedAtMs);

  async function handleStop() {
    // Stop early and complete the set
    const elapsed = Math.max(1, totalDuration - displaySeconds);
    await completeCurrentSet({ durationSecondsDone: elapsed });
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-successGreen">
            {t('workout.timedExercise')}
          </span>
          <h1 className="mt-0.5 text-xl font-extrabold leading-tight text-slate-100">
            {ex.exerciseName}
          </h1>
          {ex.notes && (
            <p className="mt-1 text-xs text-slate-400 italic">{ex.notes}</p>
          )}
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
          currentPhase={isRunning || isPaused ? 'timed_running' : 'exercising'}
          currentSet={currentSetNumber}
          currentProgress={isRunning || isPaused ? (totalDuration - displaySeconds) / totalDuration : 0}
        />
      </div>

      {/* ── Set pill ───────────────────────────────────────────── */}
      <div className="px-5 pb-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-successGreen/15 px-3 py-1">
          <span className="text-sm font-bold text-successGreen">
            {t('workout.setOf', { current: currentSetNumber, total: ex.totalSets })}
          </span>
        </div>
      </div>

      {/* ── Workout elapsed timers (always visible) ───────────── */}
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

      {/* ── Circular Timer display ──────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg
            width="240"
            height="240"
            className={`-rotate-90 transition-all duration-300 ${isPaused ? 'animate-pulse opacity-75' : ''}`}
          >
            {/* Track */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="rgba(16,185,129,0.12)"
              strokeWidth="10"
            />
            {/* Progress */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: isRunning ? 'stroke-dashoffset 0.1s linear' : 'none' }}
            />
          </svg>
          {/* Centered Timer text - no inner elapsed, it's already shown above */}
          <div className="absolute flex items-center justify-center">
            <span
              className={`text-6xl font-black tabular-nums transition-colors duration-300 ${
                isRunning && !isPaused ? 'text-successGreen' : ''
              } ${isPaused ? 'text-amber-500' : ''} ${
                !isRunning && !isPaused ? 'text-slate-300' : ''
              }`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(displaySeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 flex flex-col gap-3 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {phase.kind !== 'timed_running' ? (
          <Button
            id="btn-start-timer"
            variant="success"
            className="flex w-full items-center justify-center gap-2 py-5 text-lg font-extrabold"
            onClick={startTimedExercise}
          >
            <Play size={24} fill="currentColor" />
            {t('workout.startTimer')}
          </Button>
        ) : (
          <div className="flex gap-3">
            {/* Pause / Resume button */}
            <Button
              id="btn-pause-timer"
              variant={isPaused ? 'success' : 'ghost'}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-base font-semibold"
              onClick={togglePause}
            >
              {isPaused ? (
                <>
                  <Play size={20} fill="currentColor" />
                  {t('workout.resume')}
                </>
              ) : (
                <>
                  <Pause size={20} fill="currentColor" />
                  {t('workout.pause')}
                </>
              )}
            </Button>

            {/* Skip / Finish set early */}
            <Button
              id="btn-stop-timer"
              variant="ghost"
              className="flex-1 flex items-center justify-center gap-2 py-4 text-base font-semibold"
              loading={saving}
              onClick={handleStop}
            >
              <Square size={20} fill="currentColor" />
              {t('workout.skip')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
