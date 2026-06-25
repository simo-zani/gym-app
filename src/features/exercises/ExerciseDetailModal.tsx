import { Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MuscleGroupBadge } from '@/components/ui/MuscleGroupBadge';
import type { Exercise } from '@/types/db';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export function ExerciseDetailModal({
  exercise,
  onClose,
  onEdit,
  onDelete,
}: ExerciseDetailModalProps) {
  if (!exercise) return null;
  const isCustom = exercise.owner_id !== null;

  return (
    <Modal open={Boolean(exercise)} onClose={onClose} title={exercise.name}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <MuscleGroupBadge group={exercise.muscle_group} />
          <span className="text-xs text-slate-400">
            {isCustom ? 'Esercizio personalizzato' : 'Catalogo wger'}
          </span>
        </div>

        {exercise.description ? (
          <p className="text-sm leading-relaxed text-slate-300">{exercise.description}</p>
        ) : (
          <p className="text-sm italic text-slate-500">Nessuna descrizione.</p>
        )}

        {isCustom && (
          <div className="mt-1 flex gap-3">
            <Button variant="ghost" onClick={() => onEdit(exercise)} className="flex-1">
              <Pencil size={16} /> Modifica
            </Button>
            <Button variant="danger" onClick={() => onDelete(exercise)} className="flex-1">
              <Trash2 size={16} /> Elimina
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
