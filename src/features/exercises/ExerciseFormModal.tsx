import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { MUSCLE_GROUPS } from './muscleGroups';
import type { Exercise, MuscleGroup } from '@/types/db';

const schema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('exercises.validationNameRequired')),
    muscle_group: z.string().optional(),
    description: z.string().optional(),
    description_it: z.string().optional(),
    is_bodyweight: z.boolean().optional(),
    equipment: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof schema>>;

export interface ExerciseFormSubmit {
  name: string;
  muscle_group: MuscleGroup | null;
  description: string | null;
  description_it: string | null;
  is_bodyweight: boolean;
  equipment: string | null;
  owner_id: string | null;
}

interface ExerciseFormModalProps {
  open: boolean;
  onClose: () => void;
  // When provided, the modal edits this exercise; otherwise it creates a new one.
  exercise?: Exercise | null;
  onSubmit: (values: ExerciseFormSubmit) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
}

export function ExerciseFormModal({
  open,
  onClose,
  exercise,
  onSubmit,
  submitting,
  error,
}: ExerciseFormModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(exercise);
  const isGlobal = isEdit && exercise?.owner_id === null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema(t)) });

  const watchIsBodyweight = watch('is_bodyweight');

  useEffect(() => {
    if (open) {
      reset({
        name: exercise?.name ?? '',
        muscle_group: exercise?.muscle_group ?? '',
        description: exercise?.description ?? '',
        description_it: exercise?.description_it ?? '',
        is_bodyweight: exercise?.is_bodyweight ?? false,
        equipment: exercise?.equipment ?? '',
      });
    }
  }, [open, exercise, reset]);

  // Automatically switch equipment to 'none' if bodyweight is selected
  useEffect(() => {
    if (watchIsBodyweight) {
      setValue('equipment', 'none');
    }
  }, [watchIsBodyweight, setValue]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name,
      muscle_group: (values.muscle_group as MuscleGroup) || null,
      description: values.description?.trim() || null,
      description_it: values.description_it?.trim() || null,
      is_bodyweight: values.is_bodyweight ?? false,
      equipment: values.equipment || null,
      owner_id: exercise ? exercise.owner_id : null,
    });
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? (isGlobal ? t('exercises.editExercise') + ' (Personalizza)' : t('exercises.editExercise')) : t('exercises.createExercise')}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Name: Disabled for global exercises */}
        <Input
          id="ex-name"
          label={t('exercises.name')}
          placeholder={t('exercises.namePlaceholder')}
          error={errors.name?.message}
          disabled={isGlobal}
          {...register('name')}
        />

        {/* Muscle group: Disabled for global exercises */}
        <Select 
          id="ex-muscle" 
          label={t('exercises.muscleGroup')} 
          disabled={isGlobal}
          {...register('muscle_group')}
        >
          <option value="">{t('exercises.muscleGroupPlaceholder')}</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {t(g.labelKey)}
            </option>
          ))}
        </Select>

        {/* Bodyweight Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-bg-2 bg-bg-1 px-4 py-3">
          <label htmlFor="ex-bodyweight" className="text-sm font-medium text-slate-300 cursor-pointer">
            {t('exercises.isBodyweight')}
          </label>
          <input
            type="checkbox"
            id="ex-bodyweight"
            className="h-5 w-5 rounded border-bg-3 bg-bg-2 text-blueGlow focus:ring-blueGlow/30"
            {...register('is_bodyweight')}
          />
        </div>

        {/* Equipment Selector */}
        <Select 
          id="ex-equipment" 
          label={t('exercises.equipment')} 
          disabled={watchIsBodyweight}
          {...register('equipment')}
        >
          <option value="">— Seleziona Attrezzatura —</option>
          <option value="none">{t('exercises.equipmentTypes.none')}</option>
          <option value="dumbbell">{t('exercises.equipmentTypes.dumbbell')}</option>
          <option value="barbell">{t('exercises.equipmentTypes.barbell')}</option>
          <option value="kettlebell">{t('exercises.equipmentTypes.kettlebell')}</option>
          <option value="cable">{t('exercises.equipmentTypes.cable')}</option>
          <option value="machine">{t('exercises.equipmentTypes.machine')}</option>
        </Select>

        {/* English Description */}
        <Textarea
          id="ex-desc"
          label={t('exercises.descriptionEn')}
          placeholder="E.g. Step forward and lower your hips..."
          {...register('description')}
        />

        {/* Italian Description */}
        <Textarea
          id="ex-desc-it"
          label={t('exercises.descriptionIt')}
          placeholder="Es. Fai un passo in avanti e abbassa i fianchi..."
          {...register('description_it')}
        />

        {error && (
          <p className="rounded-lg bg-dangerRed/10 px-3 py-2 text-sm text-dangerRed">{error}</p>
        )}

        <div className="mt-1 flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            {isEdit ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

