import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { playSetDone } from './audio';
import { Button } from '@/components/ui/Button';

interface Props {
  onExitRequest: () => void;
}

export function RepsExerciseScreen({ onExitRequest }: Props) {
  const { t } = useTranslation();
  const {
    exercises,
    currentExerciseIndex,
    currentSetNumber,
    editReps,
    editWeight,
    saving,
    setEditReps,
    setEditWeight,
    completeCurrentSet,
  } = useWorkoutStore();

  const ex = exercises[currentExerciseIndex];
  if (!ex) return null;

  async function handleDone() {
    playSetDone();
    await completeCurrentSet();
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-blueSoft/70">
            {t('workout.exerciseActive')}
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
      <div className="px-5 pb-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blueGlow/15 px-3 py-1">
          <span className="text-sm font-bold text-blueSoft">
            {t('workout.setOf', { current: currentSetNumber, total: ex.totalSets })}
          </span>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-5 px-5">

        {/* Reps stepper */}
        <div className="rounded-2xl border border-bg-3 bg-bg-1 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t('workout.repsLabel')}
          </p>
          <div className="flex items-center justify-between">
            <button
              id="reps-decrease"
              onClick={() => setEditReps(editReps - 1)}
              disabled={editReps <= 0}
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-2 text-slate-300 transition active:scale-95 disabled:opacity-30"
            >
              <ChevronDown size={28} />
            </button>
            <span
              className="text-6xl font-black tabular-nums text-slate-100"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {editReps}
            </span>
            <button
              id="reps-increase"
              onClick={() => setEditReps(editReps + 1)}
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-2 text-slate-300 transition active:scale-95"
            >
              <ChevronUp size={28} />
            </button>
          </div>
        </div>

        {/* Weight stepper */}
        <div className="rounded-2xl border border-bg-3 bg-bg-1 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t('workout.weightLabel')}
          </p>
          {editWeight === null ? (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-400 italic">
                {t('workout.bodyweight')}
              </span>
              <button
                id="weight-add"
                onClick={() => setEditWeight(20)}
                className="rounded-xl bg-bg-2 px-4 py-2 text-sm font-semibold text-blueSoft transition hover:bg-bg-3"
              >
                + kg
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                id="weight-decrease"
                onClick={() =>
                  setEditWeight(editWeight > 0.5 ? Math.round((editWeight - 0.5) * 2) / 2 : null)
                }
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-2 text-slate-300 transition active:scale-95"
              >
                <ChevronDown size={28} />
              </button>
              <span
                className="text-5xl font-black tabular-nums text-slate-100"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {editWeight}
                <span className="ml-1 text-2xl font-semibold text-slate-400">kg</span>
              </span>
              <button
                id="weight-increase"
                onClick={() =>
                  setEditWeight(Math.round((editWeight + 0.5) * 2) / 2)
                }
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-2 text-slate-300 transition active:scale-95"
              >
                <ChevronUp size={28} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CTA (fixed at bottom) ────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          id="btn-done"
          variant="success"
          className="flex w-full items-center justify-center gap-2 py-5 text-lg font-extrabold"
          loading={saving}
          onClick={handleDone}
        >
          <CheckCircle2 size={24} />
          {t('workout.done')}
        </Button>
      </div>
    </div>
  );
}
