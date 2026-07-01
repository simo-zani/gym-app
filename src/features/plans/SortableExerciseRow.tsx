import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useWorkoutStore } from '@/features/workout/useWorkoutStore';
import { formatPlanExercise } from './format';
import type { PlanExerciseWithExercise } from '@/types/db';

interface SortableExerciseRowProps {
  item: PlanExerciseWithExercise;
  index: number;
  onEdit: (item: PlanExerciseWithExercise) => void;
  onDelete: (item: PlanExerciseWithExercise) => void;
}

export function SortableExerciseRow({ item, index, onEdit, onDelete }: SortableExerciseRowProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const { disabledExercises, toggleExerciseActive } = useWorkoutStore();
  const isDisabled = disabledExercises.has(item.id);
  const [swipeStart, setSwipeStart] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: swipeOffset !== 0 ? undefined : transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const offset = e.touches[0].clientX - swipeStart;
    if (offset < 0) {
      setSwipeOffset(Math.max(offset, -120));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -60) {
      onDelete(item);
    }
    setSwipeOffset(0);
  };

  return (
    <div
      ref={containerRef}
      style={style}
      className="relative overflow-hidden rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete background — only rendered while swiping, so its red fill can't
          bleed through the rounded corners of the row at rest. */}
      {swipeOffset < 0 && (
        <div className="absolute inset-0 flex items-center justify-end bg-dangerRed pr-4">
          <Trash2 size={16} className="text-white" />
        </div>
      )}

      {/* Main row */}
      <div
        ref={setNodeRef}
        className="flex items-center gap-2.5 rounded-xl border border-bg-2 bg-bg-1 px-3 py-3"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <button
          onClick={() => toggleExerciseActive(item.id)}
          className="flex h-5 w-5 flex-none items-center justify-center rounded border-2"
          style={{
            borderColor: isDisabled ? '#64748b' : '#60a5fa',
            backgroundColor: isDisabled ? 'transparent' : '#60a5fa',
          }}
        >
          {!isDisabled && <span className="text-white text-xs">✓</span>}
        </button>

        <button
          {...attributes}
          {...listeners}
          aria-label={t('common.dragToReorder')}
          className="cursor-grab touch-none text-slate-500 active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>

        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-bg-3 text-xs font-bold text-blueSoft">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${isDisabled ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
            {item.exercise?.name ?? t('plans.exerciseRemoved')}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{formatPlanExercise(item)}</p>
        </div>

        <button
          onClick={() => onEdit(item)}
          aria-label={t('common.configure')}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-bg-3 hover:text-slate-100"
        >
          <Pencil size={16} />
        </button>
      </div>
    </div>
  );
}
