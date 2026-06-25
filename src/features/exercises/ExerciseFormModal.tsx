import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { MUSCLE_GROUPS } from './muscleGroups';
import type { Exercise, MuscleGroup } from '@/types/db';

const schema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  muscle_group: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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
  const isEdit = Boolean(exercise);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Modifica esercizio' : 'Nuovo esercizio'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          id="ex-name"
          label="Nome"
          placeholder="Es. Panca piana bilanciere"
          error={errors.name?.message}
          {...register('name')}
        />
        <Select id="ex-muscle" label="Gruppo muscolare" {...register('muscle_group')}>
          <option value="">— Nessuno —</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
        <Textarea
          id="ex-desc"
          label="Descrizione (opzionale)"
          placeholder="Note su esecuzione, presa, ecc."
          {...register('description')}
        />

        {error && (
          <p className="rounded-lg bg-dangerRed/10 px-3 py-2 text-sm text-dangerRed">{error}</p>
        )}

        <div className="mt-1 flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            {isEdit ? 'Salva' : 'Crea'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
