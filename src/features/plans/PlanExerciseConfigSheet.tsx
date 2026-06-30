import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { NumberStepper } from '@/components/ui/NumberStepper';
import type { ExerciseMode, PyramidSet, PlanExerciseWithExercise } from '@/types/db';
import type { PlanExerciseInput } from './hooks';

interface ConfigSheetProps {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  /** Existing row when editing; null/undefined when adding a new one. */
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

function makeSet(setNumber: number, prev?: PyramidSet): PyramidSet {
  return {
    set_number: setNumber,
    mode: prev?.mode ?? 'reps',
    reps: prev?.reps ?? 10,
    duration_seconds: prev?.duration_seconds ?? null,
    weight_kg: prev?.weight_kg ?? null,
  };
}

// ─── Per-set row in pyramid editor ──────────────────────────────────────────
function PyramidSetRow({
  s,
  canDelete,
  onChange,
  onDelete,
}: {
  s: PyramidSet;
  canDelete: boolean;
  onChange: (updated: PyramidSet) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  function update(patch: Partial<PyramidSet>) {
    onChange({ ...s, ...patch });
  }

  return (
    <div className="rounded-xl border border-bg-3 bg-bg-2 p-3 mb-2">
      {/* Set header + mode toggle + delete */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
          {t('exerciseConfig.setN', { n: s.set_number })}
        </span>
        <div className="flex items-center gap-2">
          {/* Mini mode toggle */}
          <div className="flex rounded-lg border border-bg-3 bg-bg-1 overflow-hidden">
            {(['reps', 'time'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() =>
                  update({
                    mode: m,
                    reps: m === 'reps' ? (s.reps ?? 10) : null,
                    duration_seconds: m === 'time' ? (s.duration_seconds ?? 30) : null,
                  })
                }
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  s.mode === m ? 'bg-blueGlow text-white' : 'text-slate-400'
                }`}
              >
                {m === 'reps' ? t('exerciseConfig.setModeReps') : t('exerciseConfig.setModeTime')}
              </button>
            ))}
          </div>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="ml-1 rounded-lg p-1.5 text-slate-500 hover:bg-dangerRed/20 hover:text-dangerRed transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {s.mode === 'reps' ? (
          <NumberStepper
            label={t('exerciseConfig.reps')}
            value={s.reps ?? 10}
            onChange={(v) => update({ reps: v })}
            min={1}
            max={200}
          />
        ) : (
          <NumberStepper
            label={t('exerciseConfig.duration')}
            value={s.duration_seconds ?? 30}
            onChange={(v) => update({ duration_seconds: v })}
            min={5}
            step={15}
            max={600}
            suffix="s"
          />
        )}
        <NumberStepper
          label={t('exerciseConfig.weight')}
          value={s.weight_kg}
          onChange={(v) => update({ weight_kg: v })}
          min={0}
          step={5}
          max={500}
          decimals={2}
          suffix="kg"
          placeholder="—"
        />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
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
  const [pyramidSets, setPyramidSets] = useState<PyramidSet[]>([makeSet(1)]);

  // Reset form whenever the sheet (re)opens
  useEffect(() => {
    if (!open) return;
    const initialMode = (initial?.mode ?? 'reps') as ExerciseMode;
    const initialSets = initial?.sets ?? DEFAULTS.sets;
    setMode(initialMode);
    setSets(initialSets);
    setReps(initial?.reps ?? DEFAULTS.reps);
    setDuration(initial?.duration_seconds ?? DEFAULTS.duration_seconds);
    setWeight(initial?.weight_kg ?? null);
    setRest(initial?.rest_seconds ?? DEFAULTS.rest_seconds);
    setNotes(initial?.notes ?? '');

    if (initialMode === 'pyramid' && initial?.pyramid_config?.length) {
      setPyramidSets(initial.pyramid_config);
    } else {
      // Start with 1 set when switching to pyramid fresh
      setPyramidSets([makeSet(1)]);
    }
  }, [open, initial]);

  function addPyramidSet() {
    setPyramidSets((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, makeSet(prev.length + 1, last)];
    });
  }

  function removePyramidSet(idx: number) {
    setPyramidSets((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, set_number: i + 1 })),
    );
  }

  function updatePyramidSet(idx: number, updated: PyramidSet) {
    setPyramidSets((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  }

  async function handleSave() {
    await onSubmit({
      exercise_id: exerciseId,
      sets: mode === 'pyramid' ? pyramidSets.length : sets,
      mode,
      reps: mode === 'reps' ? reps : null,
      duration_seconds: mode === 'time' ? duration : null,
      weight_kg: mode !== 'pyramid' ? weight : null,
      rest_seconds: rest,
      notes: notes.trim() || null,
      pyramid_config: mode === 'pyramid' ? pyramidSets : null,
    });
  }

  const allModes: { value: ExerciseMode; label: string }[] = [
    { value: 'reps', label: t('exerciseConfig.reps') },
    { value: 'time', label: t('exerciseConfig.timedMode') },
    { value: 'pyramid', label: t('exerciseConfig.pyramidMode') },
  ];

  // ── The 3-tab toggle goes in stickyHeader so it never moves ─────────────
  const modeToggle = (
    <div className="mb-4">
      <div className="flex rounded-xl border border-bg-3 bg-bg-2 p-1">
        {allModes.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors ${
              mode === value ? 'bg-blueGlow text-white' : 'text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`${t('exerciseConfig.title')} · ${exerciseName}`}
      stickyHeader={modeToggle}
    >
      <div className="flex flex-col gap-4 pb-2">

        {/* ── REPS mode ──────────────────────────────────────────────── */}
        {mode === 'reps' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <NumberStepper
                label={t('exerciseConfig.series')}
                value={sets}
                onChange={setSets}
                min={1}
                max={20}
              />
              <NumberStepper
                label={t('exerciseConfig.reps')}
                value={reps}
                onChange={setReps}
                min={1}
                max={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberStepper
                label={t('exerciseConfig.weight')}
                value={weight}
                onChange={setWeight}
                min={0}
                step={5}
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
          </>
        )}

        {/* ── TIME mode ──────────────────────────────────────────────── */}
        {mode === 'time' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <NumberStepper
                label={t('exerciseConfig.series')}
                value={sets}
                onChange={setSets}
                min={1}
                max={20}
              />
              <NumberStepper
                label={t('exerciseConfig.duration')}
                value={duration}
                onChange={setDuration}
                min={5}
                step={15}
                max={600}
                suffix="s"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberStepper
                label={t('exerciseConfig.weight')}
                value={weight}
                onChange={setWeight}
                min={0}
                step={5}
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
          </>
        )}

        {/* ── PYRAMID mode ───────────────────────────────────────────── */}
        {mode === 'pyramid' && (
          <>
            {/* Global rest */}
            <NumberStepper
              label={t('exerciseConfig.rest')}
              value={rest}
              onChange={setRest}
              min={0}
              step={15}
              max={600}
              suffix="s"
            />

            {/* Per-set editor */}
            <div>
              {pyramidSets.map((s, i) => (
                <PyramidSetRow
                  key={s.set_number}
                  s={s}
                  canDelete={pyramidSets.length > 1}
                  onChange={(updated) => updatePyramidSet(i, updated)}
                  onDelete={() => removePyramidSet(i)}
                />
              ))}

              {/* Add set button */}
              <button
                type="button"
                onClick={addPyramidSet}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blueGlow/50 py-3 text-sm font-bold text-blueGlow transition-colors hover:border-blueGlow hover:bg-blueGlow/10 active:scale-95"
              >
                <Plus size={16} />
                {t('exerciseConfig.addSet', 'Aggiungi serie')}
              </button>
            </div>
          </>
        )}

        {/* Notes — always shown */}
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
