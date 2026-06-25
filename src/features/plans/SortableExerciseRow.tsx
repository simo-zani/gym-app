import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { formatPlanExercise } from './format';
import type { PlanExerciseWithExercise } from '@/types/db';

interface SortableExerciseRowProps {
  item: PlanExerciseWithExercise;
  index: number;
  onEdit: (item: PlanExerciseWithExercise) => void;
  onDelete: (item: PlanExerciseWithExercise) => void;
}

export function SortableExerciseRow({ item, index, onEdit, onDelete }: SortableExerciseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2.5 rounded-xl border border-bg-2 bg-bg-1 px-3 py-3"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Trascina per riordinare"
        className="cursor-grab touch-none text-slate-500 active:cursor-grabbing"
      >
        <GripVertical size={18} />
      </button>

      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-bg-3 text-xs font-bold text-blueSoft">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-100">
          {item.exercise?.name ?? 'Esercizio rimosso'}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{formatPlanExercise(item)}</p>
      </div>

      <button
        onClick={() => onEdit(item)}
        aria-label="Configura esercizio"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-bg-3 hover:text-slate-100"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => onDelete(item)}
        aria-label="Rimuovi esercizio"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-bg-3 hover:text-dangerRed"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
