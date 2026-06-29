import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { NumberStepper } from '@/components/ui/NumberStepper';
import type { ExerciseMode, PlanExerciseWithExercise } from '@/types/db';
import type { PlanExerciseInput } from './hooks';

interface ConfigSheetProps {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  // Existing row when editing; null when adding a new one.
  initial?: PlanExerciseWithExercise | null;
  onSubmit: (input: PlanExerciseInput) => Promise<void>;
  submitting?: boolean;
}

const DEFAULTS = {
  sets: 3,
  reps: 10,
  duration_seconds: 30,
  rest_seconds: 60,
};

export function PlanExerciseConfigSheet({
  open,
  onClose,
  exerciseId,
  exerciseName,
  initial,
  onSubmit,
  submitting,
}: ConfigSheetProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ExerciseMode>('reps');
  const [sets, setSets] = useState(DEFAULTS.sets);
  const [reps, setReps] = useState(DEFAULTS.reps);
  const [duration, setDuration] = useState(DEFAULTS.duration_seconds);
  const [weight, setWeight] = useState<number | null>(null);
  const [rest, setRest] = useState(DEFAULTS.rest_seconds);
  const [notes, setNotes] = useState('');

  // Reset form whenever the sheet (re)opens for a different target.
  useEffect(() => {
    if (!open) return;
    setMode(initial?.mode ?? 'reps');
    setSets(initial?.sets ?? DEFAULTS.sets);
    setReps(initial?.reps ?? DEFAULTS.reps);
    setDuration(initial?.duration_seconds ?? DEFAULTS.duration_seconds);
    setWeight(initial?.weight_kg ?? null);
    setRest(initial?.rest_seconds ?? DEFAULTS.rest_seconds);
    setNotes(initial?.notes ?? '');
  }, [open, initial]);

  async function handleSave() {
    await onSubmit({
      exercise_id: exerciseId,
      sets,
      mode,
      reps: mode === 'reps' ? reps : null,
      duration_seconds: mode === 'time' ? duration : null,
      weight_kg: weight,
      rest_seconds: rest,
      notes: notes.trim() || null,
    });
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={`${t('exerciseConfig.title')} · ${exerciseName}`}>
      <div className="flex flex-col gap-4">
        {/* Mode toggle */}
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
            {t('exerciseConfig.mode')}
          </span>
          <div className="flex rounded-xl border border-bg-3 bg-bg-2 p-1">
            {(['reps', 'time'] as ExerciseMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
                  mode === m ? 'bg-blueGlow text-white' : 'text-slate-400'
                }`}
              >
                {m === 'reps' ? t('exerciseConfig.reps') : t('exerciseConfig.timedMode')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberStepper label={t('exerciseConfig.series')} value={sets} onChange={setSets} min={1} max={20} />
          {mode === 'reps' ? (
            <NumberStepper label={t('exerciseConfig.reps')} value={reps} onChange={setReps} min={1} max={100} />
          ) : (
            <NumberStepper
              label={t('exerciseConfig.duration')}
              value={duration}
              onChange={setDuration}
              min={5}
              step={5}
              max={600}
              suffix="s"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberStepper
            label={t('exerciseConfig.weight')}
            value={weight}
            onChange={setWeight}
            min={0}
            step={1.25}
            max={500}
            decimals={2}
            suffix="kg"
            placeholder="—"
          />
          <NumberStepper
            label={t('exerciseConfig.rest')}
            value={rest}
            onChange={setRest}
            min={0}
            step={15}
            max={600}
            suffix="s"
          />
        </div>

        <Textarea
          id="pe-notes"
          label={t('exerciseConfig.notes')}
          placeholder={t('exerciseConfig.notesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Button onClick={handleSave} loading={submitting} className="mt-1">
          {t('common.save')}
        </Button>
      </div>
    </BottomSheet>
  );
}
