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
  });

type FormValues = z.infer<ReturnType<typeof schema>>;

export interface ExerciseFormSubmit {
  name: string;
  muscle_group: MuscleGroup | null;
  description: string | null;
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema(t)) });

  useEffect(() => {
    if (open) {
      reset({
        name: exercise?.name ?? '',
        muscle_group: exercise?.muscle_group ?? '',
        description: exercise?.description ?? '',
      });
    }
  }, [open, exercise, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name,
      muscle_group: (values.muscle_group as MuscleGroup) || null,
      description: values.description?.trim() || null,
    });
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('exercises.editExercise') : t('exercises.createExercise')}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          id="ex-name"
          label={t('exercises.name')}
          placeholder={t('exercises.namePlaceholder')}
          error={errors.name?.message}
          {...register('name')}
        />
        <Select id="ex-muscle" label={t('exercises.muscleGroup')} {...register('muscle_group')}>
          <option value="">{t('exercises.muscleGroupPlaceholder')}</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
        <Textarea
          id="ex-desc"
          label={t('exercises.description')}
          placeholder={t('exercises.descriptionPlaceholder')}
          {...register('description')}
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
