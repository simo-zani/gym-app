import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Square } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { useCountdown, formatTime } from './useCountdown';
import { playTimedEnd } from './audio';
import { Button } from '@/components/ui/Button';

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
    startTimedExercise,
    onTimedEnd,
    completeCurrentSet,
  } = useWorkoutStore();

  const ex = exercises[currentExerciseIndex];
  if (!ex) return null;

  const isRunning = phase.kind === 'timed_running';
  const targetEpochMs = phase.kind === 'timed_running' ? phase.targetEpochMs : null;

  const handleTimerEnd = useCallback(async () => {
    playTimedEnd();
    await onTimedEnd();
  }, [onTimedEnd]);

  const secondsLeft = useCountdown(isRunning, targetEpochMs, handleTimerEnd);

  const displaySeconds = isRunning ? secondsLeft : (ex.durationSeconds ?? 0);

  async function handleStop() {
    // Stop early and complete the set
    const elapsed = Math.max(1, (ex.durationSeconds ?? 0) - secondsLeft);
    // We reuse onTimedEnd which sets phase→exercising first, then saves
    await completeCurrentSet({ durationSecondsDone: elapsed });
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-dangerRed/70">
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
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-bg-2 hover:text-dangerRed"
        >
          {t('workout.exit')}
        </button>
      </div>

      {/* ── Set pill ───────────────────────────────────────────── */}
      <div className="px-5 pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-dangerRed/15 px-3 py-1">
          <span className="text-sm font-bold text-dangerRed">
            {t('workout.setOf', { current: currentSetNumber, total: ex.totalSets })}
          </span>
        </div>
      </div>

      {/* ── Timer display ──────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center">
        <div
          className={`flex flex-col items-center gap-4 rounded-3xl px-12 py-10 transition-all duration-300 ${
            isRunning
              ? 'bg-dangerRed/10 ring-2 ring-dangerRed/40'
              : 'bg-bg-1 ring-2 ring-bg-3'
          }`}
        >
          <span
            className={`text-8xl font-black tabular-nums transition-colors duration-300 ${
              isRunning ? 'text-dangerRed' : 'text-slate-300'
            }`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatTime(displaySeconds)}
          </span>
          {!isRunning && (
            <p className="text-sm text-slate-500">{t('workout.timedHint')}</p>
          )}
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 flex flex-col gap-3 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {!isRunning ? (
          <Button
            id="btn-start-timer"
            variant="danger"
            className="flex w-full items-center justify-center gap-2 py-5 text-lg font-extrabold"
            onClick={startTimedExercise}
          >
            <Play size={24} fill="currentColor" />
            {t('workout.startTimer')}
          </Button>
        ) : (
          <Button
            id="btn-stop-timer"
            variant="ghost"
            className="flex w-full items-center justify-center gap-2 py-4 text-base font-semibold"
            loading={saving}
            onClick={handleStop}
          >
            <Square size={20} fill="currentColor" />
            {t('workout.stopTimer')}
          </Button>
        )}
      </div>
    </div>
  );
}
