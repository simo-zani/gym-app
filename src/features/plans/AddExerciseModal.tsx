import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useExercises } from '@/features/exercises/hooks';
import { muscleGroupLabelKey } from '@/features/exercises/muscleGroups';
import type { Exercise } from '@/types/db';

interface AddExerciseModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function AddExerciseModal({ open, onClose, onSelect }: AddExerciseModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search);
  const { data, isLoading } = useExercises({ search: debounced });

  return (
    <Modal open={open} onClose={onClose} title={t('addExerciseModal.title')}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-bg-3 bg-bg-1 px-3.5 py-2.5">
          <Search size={18} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('addExerciseModal.search')}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>

        <div className="max-h-72 overflow-y-auto">
          {isLoading && <Spinner />}
          {data && data.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">{t('addExerciseModal.noResults')}</p>
          )}
          <ul className="flex flex-col gap-1.5">
            {data?.map((ex) => (
              <li key={ex.id}>
                <button
                  onClick={() => onSelect(ex)}
                  className="flex w-full flex-col rounded-xl border border-bg-2 bg-bg-1 px-3.5 py-2.5 text-left transition hover:border-bg-3"
                >
                  <span className="truncate text-sm font-semibold text-slate-100">{ex.name}</span>
                  <span className="text-xs text-slate-400">
                    {t(muscleGroupLabelKey(ex.muscle_group))} ·{' '}
                    {ex.owner_id !== null ? t('exercises.custom') : t('exercises.wger')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
