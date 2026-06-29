import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Clock, Layers, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from './useWorkoutStore';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export function WorkoutSummaryScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { startedAtMs, sets, finish, reset } = useWorkoutStore();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Duration
  const durationMs = startedAtMs ? Date.now() - startedAtMs : 0;
  const durationMin = Math.round(durationMs / 60000);

  // Stats
  const completedSets = sets.length;
  const completedExercises = new Set(sets.map((s) => s.exerciseName)).size;

  async function handleFinish() {
    setSaving(true);
    try {
      await finish(notes);
    } finally {
      setSaving(false);
      reset();
      navigate('/');
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center px-5 pt-12 pb-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-successGreen/15 ring-2 ring-successGreen/30">
          <Trophy size={36} className="text-successGreen" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100">
          {t('workout.summaryTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{t('workout.summarySubtitle')}</p>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────── */}
      <div className="mx-5 mb-6 grid grid-cols-3 gap-3">
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

      {/* ── Set breakdown ──────────────────────────────────────── */}
      <div className="mx-5 mb-6 rounded-2xl border border-bg-3 bg-bg-1 overflow-hidden">
        <p className="border-b border-bg-3 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('workout.setBreakdown')}
        </p>
        <div className="divide-y divide-bg-3">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200">{s.exerciseName}</span>
                <span className="text-xs text-slate-500">
                  {t('workout.setLabel')} {s.setNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-100">
                  {s.mode === 'reps'
                    ? `${s.repsDone ?? 0} rep${s.repsDone !== 1 ? 's' : ''}`
                    : `${s.durationSecondsDone ?? 0}s`}
                </span>
                {s.weightKg != null && (
                  <p className="text-xs text-slate-500">{s.weightKg} kg</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Notes ──────────────────────────────────────────────── */}
      <div className="mx-5 mb-6">
        <Textarea
          id="workout-notes"
          label={t('workout.notesLabel')}
          placeholder={t('workout.notesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent px-5 pb-8 pt-4"
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
