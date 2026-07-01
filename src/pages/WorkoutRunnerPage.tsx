import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { usePlan, usePlanExercises } from '@/features/plans/hooks';
import { useWorkoutStore, type ExerciseInSession } from '@/features/workout/useWorkoutStore';
import { RepsExerciseScreen } from '@/features/workout/RepsExerciseScreen';
import { TimedExerciseScreen } from '@/features/workout/TimedExerciseScreen';
import { RestScreen } from '@/features/workout/RestScreen';
import { WarmupScreen } from '@/features/workout/WarmupScreen';
import { CooldownScreen } from '@/features/workout/CooldownScreen';
import { ExerciseHubScreen } from '@/features/workout/ExerciseHubScreen';
import { WorkoutSummaryScreen } from '@/features/workout/WorkoutSummaryScreen';
import { unlockAudio } from '@/features/workout/audio';
import type { PlanExerciseWithExercise } from '@/types/db';

export function WorkoutRunnerPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const planQuery = usePlan(id);
  const exercisesQuery = usePlanExercises(id);

  const { phase, planId, start, finish, reset } = useWorkoutStore();

  const [exitOpen, setExitOpen] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // ── Wake Lock ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;

    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) {
          lock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Not supported or denied — non-critical
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      lock?.release();
    };
  }, []);

  // ── Block swipe-back navigation during active workout ──────────────────────
  useEffect(() => {
    const isWorkoutActive = phase.kind !== 'idle' && phase.kind !== 'starting';

    if (!isWorkoutActive) return;

    const handlePopState = () => {
      // Re-push state to block the back navigation
      window.history.pushState(null, '', window.location.pathname);
    };

    // Push state to prevent initial back navigation
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [phase.kind]);

  // ── Auto-start ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const data = planQuery.data;
    const exercises = exercisesQuery.data;

    // If session already running for this plan — keep it (reload recovery)
    if (phase.kind !== 'idle' && planId === id) return;

    if (!data || !exercises || exercises.length === 0) return;

    const mapped: ExerciseInSession[] = (exercises as PlanExerciseWithExercise[]).map((item) => ({
      planExerciseId: item.id,
      exerciseId: item.exercise_id,
      exerciseName: item.exercise?.name ?? t('plans.exercise'),
      position: item.position,
      mode: item.mode,
      totalSets: item.sets,
      reps: item.reps,
      durationSeconds: item.duration_seconds,
      weightKg: item.weight_kg,
      restSeconds: item.rest_seconds,
      notes: item.notes,
      pyramidConfig: item.pyramid_config ?? null,
    }));

    unlockAudio();

    start({ id: data.id, name: data.name, exercises: mapped }).catch((err) => {
      setStartError(err instanceof Error ? err.message : t('common.unexpectedError'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planQuery.data, exercisesQuery.data]);

  // ── Exit handler ───────────────────────────────────────────────────────────
  async function handleConfirmExit() {
    const { sessionId } = useWorkoutStore.getState();
    if (sessionId) {
      try {
        await finish();
      } catch {
        // ignore
      }
    }
    reset();
    navigate('/');
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  const isLoading =
    planQuery.isLoading ||
    exercisesQuery.isLoading ||
    phase.kind === 'idle' ||
    phase.kind === 'starting';

  if (startError) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 bg-bg-0 p-6 text-center">
        <p className="text-sm text-dangerRed">{startError}</p>
        <Button variant="ghost" onClick={() => navigate('/')}>
          {t('plans.backToPlans')}
        </Button>
      </div>
    );
  }

  if (planQuery.isError || exercisesQuery.isError) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 bg-bg-0 p-6 text-center">
        <p className="text-sm text-dangerRed">{t('plans.notFound')}</p>
        <Button variant="ghost" onClick={() => navigate('/')}>
          {t('plans.backToPlans')}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-bg-0">
        <Spinner />
      </div>
    );
  }

  // ── Main runner ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-bg-0">
      {/* Phase router */}
      {phase.kind === 'warmup' && (
        <WarmupScreen onExitRequest={() => setExitOpen(true)} />
      )}
      {phase.kind === 'exercising' && (() => {
        const { exercises, currentExerciseIndex, currentSetNumber } = useWorkoutStore.getState();
        const ex = exercises[currentExerciseIndex];
        if (!ex) return null;

        // Resolve effective mode for this set
        let effectiveMode: 'reps' | 'time' = ex.mode === 'time' ? 'time' : 'reps';
        if (ex.mode === 'pyramid' && ex.pyramidConfig) {
          const cfg = ex.pyramidConfig[currentSetNumber - 1] ?? ex.pyramidConfig[ex.pyramidConfig.length - 1];
          effectiveMode = cfg.mode;
        }

        if (effectiveMode === 'reps') return <RepsExerciseScreen onExitRequest={() => setExitOpen(true)} />;
        return <TimedExerciseScreen onExitRequest={() => setExitOpen(true)} />;
      })()}
      {phase.kind === 'timed_running' && (
        <TimedExerciseScreen onExitRequest={() => setExitOpen(true)} />
      )}
      {phase.kind === 'resting' && (
        <RestScreen onExitRequest={() => setExitOpen(true)} />
      )}
      {phase.kind === 'cooldown' && (
        <CooldownScreen onExitRequest={() => setExitOpen(true)} />
      )}
      {phase.kind === 'exercise_hub' && (
        <ExerciseHubScreen onExitRequest={() => setExitOpen(true)} />
      )}
      {phase.kind === 'completed' && <WorkoutSummaryScreen />}

      {/* Exit confirmation modal */}
      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title={t('workout.exitConfirmTitle')}
      >
        <p className="mb-6 text-sm text-slate-400">{t('workout.exitConfirmBody')}</p>
        <div className="flex flex-col gap-3">
          <Button
            id="btn-confirm-exit"
            variant="danger"
            className="w-full"
            onClick={handleConfirmExit}
          >
            {t('workout.exitConfirmButton')}
          </Button>
          <Button
            id="btn-cancel-exit"
            variant="ghost"
            className="w-full"
            onClick={() => setExitOpen(false)}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
