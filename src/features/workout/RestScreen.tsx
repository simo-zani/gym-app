import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SkipForward,
  Play,
  Pause,
  Droplet,
  Wind,
  Activity,
  Brain,
  Smile,
  Zap,
  Shield,
  Heart,
  Award,
  Flame,
  Info,
  X,
  ChevronDown,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { useCountdown, formatTime } from './useCountdown';
import { playRestEnd, vibrateRestEnd } from './audio';
import { Button } from '@/components/ui/Button';
import { ExerciseProgressBar } from './ExerciseProgressBar';
import { useElapsedSeconds, formatElapsed } from './useElapsedSeconds';

interface Props {
  onExitRequest: () => void;
}

export function RestScreen({ onExitRequest }: Props) {
  const { t } = useTranslation();
  const {
    exercises,
    sets,
    phase,
    startedAtMs,
    currentExerciseStartedAtMs,
    onRestEnd,
    adjustRest,
    skipRest,
    togglePause,
    planName,
  } = useWorkoutStore();

  if (phase.kind !== 'resting') return null;

  const { restTargetEpochMs, nextExerciseIndex, nextSetNumber } = phase;
  const isPaused = !!phase.isPaused;
  const pausedSecondsLeft = phase.pausedSecondsLeft;
  const nextEx = exercises[nextExerciseIndex];

  // Overview popup state
  const [overviewOpen, setOverviewOpen] = useState(false);
  // Which exercise row is expanded to reveal its per-set breakdown
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const handleRestEnd = useCallback(() => {
    playRestEnd();
    vibrateRestEnd();
    setOverviewOpen(false); // close popup when timer ends
    onRestEnd();
  }, [onRestEnd]);

  const secondsLeft = useCountdown(
    true,
    restTargetEpochMs,
    handleRestEnd,
    isPaused,
    pausedSecondsLeft
  );

  // The exercise we just completed (index before next)
  const currentExerciseIndex = nextSetNumber === 1 ? nextExerciseIndex - 1 : nextExerciseIndex;
  const currentEx = exercises[currentExerciseIndex];

  // Determine progress for the ring animation
  const totalRest = exercises[nextExerciseIndex - 1 >= 0
    ? nextSetNumber === 1 ? nextExerciseIndex - 1 : nextExerciseIndex
    : nextExerciseIndex]?.restSeconds ?? 60;

  const displaySeconds = Math.min(
    isPaused ? (pausedSecondsLeft ?? 0) : secondsLeft,
    totalRest
  );
  const progress = Math.max(0, Math.min(1, displaySeconds / totalRest));

  // Elapsed timers
  const exerciseElapsed = useElapsedSeconds(currentExerciseStartedAtMs);
  const workoutElapsed = useElapsedSeconds(startedAtMs);

  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  // `progress` is the remaining fraction; offset = C * progress makes the arc
  // fill up clockwise as time elapses (empty at start → full at the end).
  const strokeDashoffset = circumference * progress;

  // Ambient glow colour follows the ring (amber while paused, blue otherwise).
  const glowRgb = isPaused ? '217, 119, 6' : '96, 165, 250';

  // Per-exercise completion map (keyed by planExerciseId for uniqueness)
  const setsByExercise: Record<string, number> = {};
  // Per-exercise list of completed set results, keyed by setNumber for lookup
  const setResultsByExercise: Record<string, Record<number, (typeof sets)[number]>> = {};
  for (const s of sets) {
    setsByExercise[s.planExerciseId] = (setsByExercise[s.planExerciseId] ?? 0) + 1;
    (setResultsByExercise[s.planExerciseId] ??= {})[s.setNumber] = s;
  }

  // 10 Motivational/educational rest tips
  const ALL_TIPS = [
    { icon: Droplet, textKey: 'workout.tips.hydrate' },
    { icon: Wind, textKey: 'workout.tips.breathe' },
    { icon: Activity, textKey: 'workout.tips.stretch' },
    { icon: Brain, textKey: 'workout.tips.focus' },
    { icon: Smile, textKey: 'workout.tips.relax' },
    { icon: Zap, textKey: 'workout.tips.effort' },
    { icon: Shield, textKey: 'workout.tips.posture' },
    { icon: Heart, textKey: 'workout.tips.heart' },
    { icon: Award, textKey: 'workout.tips.consistency' },
    { icon: Flame, textKey: 'workout.tips.energy' },
  ];

  const [shuffledTips, setShuffledTips] = useState<typeof ALL_TIPS>([]);
  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const shuffled = [...ALL_TIPS].sort(() => Math.random() - 0.5);
    setShuffledTips(shuffled);
  }, []);

  useEffect(() => {
    if (shuffledTips.length === 0) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % shuffledTips.length);
        setVisible(true);
      }, 500);
    }, 10000);
    return () => clearInterval(interval);
  }, [shuffledTips]);

  return (
    <div className="relative flex min-h-screen flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: '120px' }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-blueSoft">
            {t('workout.rest')}
          </span>
          <h2 className="mt-0.5 text-lg font-bold text-slate-100">
            {nextEx?.exerciseName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Overview popup button */}
          <button
            onClick={() => setOverviewOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-1 text-slate-400 transition hover:bg-bg-2 hover:text-slate-200"
            title={t('workout.overview')}
          >
            <Info size={16} />
          </button>
          <button
            onClick={onExitRequest}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-dangerRed transition hover:bg-bg-2"
          >
            {t('workout.exit')}
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {currentEx && (
        <div className="px-5 pb-3">
          <ExerciseProgressBar
            totalSets={currentEx.totalSets}
            currentPhase="resting"
            currentSet={nextSetNumber === 1 ? currentEx.totalSets : nextSetNumber - 1}
            nextSetAfterRest={nextSetNumber === 1 ? undefined : nextSetNumber}
            currentProgress={1 - progress}
          />
        </div>
      )}

      {/* ── Workout elapsed timers ── */}
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

      {/* ── Circular timer with side buttons (centered) ── */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-4 w-full px-5">
          <button
            id="rest-minus15-side"
            onClick={() => adjustRest(-15)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-bg-3 bg-bg-1 text-xs font-bold text-slate-300 transition hover:bg-bg-2 active:scale-90 shadow-lg"
          >
            −15s
          </button>

          <div className="relative flex items-center justify-center">
            {/* Ambient phase glow */}
            <div
              aria-hidden
              className="phase-glow pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-colors duration-500"
              style={{ background: `radial-gradient(circle, rgba(${glowRgb}, 0.32) 0%, rgba(${glowRgb}, 0) 70%)` }}
            />
            <svg
              width="240"
              height="240"
              className={`relative z-10 -rotate-90 transition-all duration-300 ${isPaused ? 'animate-pulse' : ''}`}
            >
              <circle cx="120" cy="120" r={radius} fill="none" stroke={isPaused ? 'rgba(217,119,6,0.12)' : 'rgba(96,165,250,0.12)'} strokeWidth="14" />
              <circle
                cx="120" cy="120" r={radius} fill="none" stroke={isPaused ? '#d97706' : '#60a5fa'} strokeWidth="14"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>
            <div className="absolute z-10 flex items-center justify-center">
              <span
                className={`text-6xl font-black tabular-nums transition-colors duration-300 ${
                  isPaused ? 'animate-pulse text-amber-500' : 'text-blueSoft'
                }`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTime(displaySeconds)}
              </span>
            </div>
          </div>

          <button
            id="rest-plus15-side"
            onClick={() => adjustRest(15)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-bg-3 bg-bg-1 text-xs font-bold text-slate-300 transition hover:bg-bg-2 active:scale-90 shadow-lg"
          >
            +15s
          </button>
        </div>
      </div>

      {/* ── Tip bar and next set info ── */}
      <div className="flex flex-col gap-3 items-center px-5">
        {shuffledTips.length > 0 && (() => {
          const currentTip = shuffledTips[tipIndex];
          const TipIcon = currentTip.icon;
          return (
            <div
              className={`flex min-h-[4.75rem] items-center gap-3 rounded-2xl border border-blueSoft/10 bg-blueGlow/5 px-4 py-3.5 w-[calc(100%-2.5rem)] max-w-sm shadow-lg shadow-blueGlow/5 transition-opacity duration-500 ease-in-out ${
                visible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <TipIcon size={20} className="text-blueSoft shrink-0" />
              <span className="text-xs font-semibold leading-relaxed text-slate-300 text-center">
                {t(currentTip.textKey)}
              </span>
            </div>
          );
        })()}

        {/* Next set info */}
        {nextEx && (
          <div className="w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border border-bg-3 bg-bg-1 px-5 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
              {t('workout.upNext')}
            </p>
            <p className="font-bold text-slate-200">{nextEx.exerciseName}</p>
            <p className="text-sm text-slate-400 mt-0.5">
              {t('workout.setOf', { current: nextSetNumber, total: nextEx.totalSets })}
              {nextEx.mode === 'reps' && nextEx.reps != null
                ? ` · ${nextEx.reps} ${t('workout.repsShort')}` : ''}
              {nextEx.weightKg != null
                ? ` · ${nextEx.weightKg} kg`
                : nextEx.mode === 'reps' ? ` · ${t('workout.bodyweight').toLowerCase()}` : ''}
            </p>
          </div>
        )}
      </div>

      {/* ── Controls (fixed at bottom) ── */}
      <div
        className="fixed inset-x-0 bottom-0 mx-auto max-w-md flex gap-3 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          id="btn-pause-rest"
          variant={isPaused ? 'success' : 'ghost'}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-base font-semibold"
          onClick={togglePause}
        >
          {isPaused ? (
            <><Play size={20} fill="currentColor" />{t('workout.resume')}</>
          ) : (
            <><Pause size={20} fill="currentColor" />{t('workout.pause')}</>
          )}
        </Button>
        <Button
          id="btn-skip-rest"
          variant="ghost"
          className="flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold bg-slate-700 hover:bg-slate-600"
          onClick={skipRest}
        >
          <SkipForward size={20} />
          {t('workout.skip')}
        </Button>
      </div>

      {/* ── Overview popup overlay ── */}
      {overviewOpen && (
        <div
          className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-bg-0/95 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out', paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Popup header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-bg-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {planName}
              </span>
              <h2 className="text-base font-bold text-slate-100">{t('workout.overview')}</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Live mini-timer in popup header */}
              <span className={`text-2xl font-black tabular-nums ${isPaused ? 'text-amber-500' : 'text-blueSoft'}`}>
                {formatTime(displaySeconds)}
              </span>
              <button
                onClick={() => setOverviewOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-2 text-slate-400 transition hover:bg-bg-3 hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Exercise list */}
          <div
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-2.5"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {exercises.map((ex, idx) => {
              const setsCompleted = setsByExercise[ex.planExerciseId] ?? 0;
              const isDone = setsCompleted >= ex.totalSets;
              // The exercise currently being performed: we're resting between its sets.
              const isInProgress = idx === nextExerciseIndex && nextSetNumber !== 1;
              // A brand-new upcoming exercise (starting from its first set).
              const isNext = idx === nextExerciseIndex && nextSetNumber === 1;

              const isExpanded = expandedExercise === ex.planExerciseId;
              const exSetResults = setResultsByExercise[ex.planExerciseId] ?? {};

              return (
                <div
                  key={ex.planExerciseId}
                  className={`rounded-2xl border transition-all ${
                    isInProgress
                      ? 'border-successGreen/30 bg-successGreen/5'
                      : isNext
                      ? 'border-blueSoft/30 bg-blueSoft/5'
                      : isDone
                      ? 'border-bg-3/40 bg-bg-1/50'
                      : 'border-bg-3/30 bg-bg-1/40'
                  } ${isDone && !isExpanded ? 'opacity-60' : ''}`}
                >
                  <button
                    onClick={() =>
                      setExpandedExercise((prev) =>
                        prev === ex.planExerciseId ? null : ex.planExerciseId
                      )
                    }
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={20} className="text-successGreen" strokeWidth={2} />
                      ) : isInProgress ? (
                        <ChevronRight size={20} className="text-successGreen" strokeWidth={2.5} />
                      ) : isNext ? (
                        <ChevronRight size={20} className="text-blueSoft" strokeWidth={2.5} />
                      ) : (
                        <Circle size={20} className="text-slate-600" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${isDone ? 'text-slate-400' : 'text-slate-200'}`}>
                        {ex.exerciseName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {setsCompleted > 0 ? `${setsCompleted}/${ex.totalSets}` : `0/${ex.totalSets}`} set
                      </p>
                    </div>
                    {isInProgress && (
                      <span className="shrink-0 rounded-full bg-successGreen/15 px-2 py-0.5 text-[10px] font-bold uppercase text-successGreen">
                        {t('workout.inProgress')}
                      </span>
                    )}
                    {isNext && (
                      <span className="shrink-0 rounded-full bg-blueSoft/15 px-2 py-0.5 text-[10px] font-bold uppercase text-blueSoft">
                        {t('workout.upNext')}
                      </span>
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
        </div>
      )}
    </div>
  );
}
