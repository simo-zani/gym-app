import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Layers, Dumbbell, CheckCircle2, Circle, ChevronDown, X } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { formatTime } from './useCountdown';
import { Button } from '@/components/ui/Button';

// 1..5 subjective ratings, worst → best. Emoji only (no labels).
const MOODS = [
  { value: 1, emoji: '😫' },
  { value: 2, emoji: '🙁' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
];

export function WorkoutSummaryScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { startedAtMs, exercises, sets, finish, reset } = useWorkoutStore();
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  // Whole-workout detail section expanded (revealing the exercise list).
  const [workoutOpen, setWorkoutOpen] = useState(true);
  // Which exercise row is expanded to reveal its per-set breakdown.
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Duration
  const durationMs = startedAtMs ? Date.now() - startedAtMs : 0;
  const durationMin = Math.round(durationMs / 60000);

  // Stats
  const completedSets = sets.length;
  const completedExercises = new Set(sets.map((s) => s.planExerciseId)).size;

  // Per-exercise completion maps keyed by planExerciseId (unique even when the
  // same exercise name appears more than once in the plan).
  const setsByExercise: Record<string, number> = {};
  const setResultsByExercise: Record<string, Record<number, (typeof sets)[number]>> = {};
  for (const s of sets) {
    setsByExercise[s.planExerciseId] = (setsByExercise[s.planExerciseId] ?? 0) + 1;
    (setResultsByExercise[s.planExerciseId] ??= {})[s.setNumber] = s;
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await finish({ rating, completed: true });
    } finally {
      setSaving(false);
      reset();
      navigate('/');
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* ── Fixed top: hero + stats + rating ─────────────────────── */}
      <div className="shrink-0">
        {/* Hero */}
        <div className="flex flex-col items-center px-5 pt-8 pb-6 text-center">
          <h1 className="text-2xl font-extrabold text-slate-100">
            {t('workout.summaryTitle')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{t('workout.summarySubtitle')}</p>
        </div>

        {/* Stats grid */}
        <div className="mx-5 mb-5 grid grid-cols-3 gap-3">
          <StatCard
            icon={<Clock size={20} className="text-blueSoft" />}
            value={`${durationMin}`}
            unit={t('workout.minutesAbbr')}
            label={t('workout.duration')}
          />
          <StatCard
            icon={<Layers size={20} className="text-successGreen" />}
            value={`${completedSets}`}
            label={t('workout.completedSets')}
          />
          <StatCard
            icon={<Dumbbell size={20} className="text-blueSoft" />}
            value={`${completedExercises}`}
            label={t('workout.completedExercises')}
          />
        </div>

        {/* Mood rating */}
        <div className="mx-5 mb-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t('workout.ratingQuestion')}
          </p>
          <div className="flex items-center justify-center gap-2.5">
            {MOODS.map((m) => {
              const selected = rating === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setRating((prev) => (prev === m.value ? null : m.value))}
                  aria-label={`${m.value}/5`}
                  aria-pressed={selected}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border text-2xl transition-all ${
                    selected
                      ? 'scale-110 border-successGreen/60 bg-successGreen/15'
                      : 'border-bg-3 bg-bg-1 opacity-50 hover:opacity-90'
                  }`}
                >
                  {m.emoji}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Scrollable: workout detail (expandable) + notes ──────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {/* Workout detail — the whole plan is expandable */}
        <div className="rounded-2xl border border-bg-3 bg-bg-1">
          <button
            onClick={() => setWorkoutOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t('workout.workoutDetails')}
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-500 transition-transform ${workoutOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {workoutOpen && (
            <div className="border-t border-bg-3/60 p-3 space-y-2.5">
              {exercises.map((ex) => {
                const setsCompleted = setsByExercise[ex.planExerciseId] ?? 0;
                const isDone = setsCompleted >= ex.totalSets;
                const isExpanded = expandedExercise === ex.planExerciseId;
                const exSetResults = setResultsByExercise[ex.planExerciseId] ?? {};

                return (
                  <div
                    key={ex.planExerciseId}
                    className="rounded-xl border border-bg-3/60 bg-bg-0/40"
                  >
                    <button
                      onClick={() =>
                        setExpandedExercise((prev) =>
                          prev === ex.planExerciseId ? null : ex.planExerciseId
                        )
                      }
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                    >
                      <div className="shrink-0">
                        {isDone ? (
                          <CheckCircle2 size={20} className="text-successGreen" strokeWidth={2} />
                        ) : (
                          <Circle size={20} className="text-slate-600" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-200">
                          {ex.exerciseName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {setsCompleted}/{ex.totalSets} set
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Per-set breakdown */}
                    {isExpanded && (
                      <div className="border-t border-bg-3/40 px-3.5 py-3 space-y-1.5">
                        {Array.from({ length: ex.totalSets }, (_, i) => i + 1).map((setNum) => {
                          const result = exSetResults[setNum];
                          const isSetDone = !!result && !result.wasSkipped;
                          const isSetSkipped = !!result && result.wasSkipped;

                          // Target for this set (falls back for not-done sets)
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
                              className="flex items-center gap-2.5 rounded-lg bg-bg-1/60 px-3 py-2"
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
          )}
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div
        className="shrink-0 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          id="btn-finish-workout"
          variant="success"
          className="w-full py-4 text-base font-bold"
          loading={saving}
          onClick={handleFinish}
        >
          {t('workout.finishAndSave')}
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  unit,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-bg-3 bg-bg-1 px-3 py-4">
      {icon}
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-black tabular-nums text-slate-100">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      <span className="text-center text-xs text-slate-500 leading-tight">{label}</span>
    </div>
  );
}
