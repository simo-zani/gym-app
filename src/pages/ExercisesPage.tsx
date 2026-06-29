import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Dumbbell, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Fab } from '@/components/ui/Fab';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MuscleGroupBadge } from '@/components/ui/MuscleGroupBadge';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { MUSCLE_GROUPS, muscleGroupLabel } from '@/features/exercises/muscleGroups';
import {
  useExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from '@/features/exercises/hooks';
import {
  ExerciseFormModal,
  type ExerciseFormSubmit,
} from '@/features/exercises/ExerciseFormModal';
import { ExerciseDetailModal } from '@/features/exercises/ExerciseDetailModal';
import type { Exercise, MuscleGroup } from '@/types/db';

export function ExercisesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError } = useExercises({ search: debouncedSearch, muscles });
  const createMut = useCreateExercise();
  const updateMut = useUpdateExercise();
  const deleteMut = useDeleteExercise();

  const customCount = useMemo(
    () => (data ?? []).filter((e) => e.owner_id !== null).length,
    [data],
  );

  function toggleMuscle(m: MuscleGroup) {
    setMuscles((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(exercise: Exercise) {
    setDetail(null);
    setEditing(exercise);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(values: ExerciseFormSubmit) {
    setFormError(null);
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...values });
      } else {
        await createMut.mutateAsync(values);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore imprevisto');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await deleteMut.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err) {
      // Most likely the exercise is still used in a plan (FK on delete restrict).
      const msg = err instanceof Error ? err.message : '';
      setDeleteError(
        /violates foreign key|restrict/i.test(msg)
          ? t('exercises.usedIn')
          : t('exercises.cannotDelete'),
      );
    }
  }

  return (
    <>
      <AppShell
        title={t('exercises.title')}
        subtitle={data ? `${data.length} ${t('common.search')} · ${customCount} ${t('exercises.custom')}` : undefined}
      >
        {/* Search */}
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-bg-2 bg-bg-1 px-3.5 py-2.5">
          <Search size={18} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('exercises.searchPlaceholder')}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Muscle filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((g) => {
            const active = muscles.includes(g.value);
            return (
              <button
                key={g.value}
                onClick={() => toggleMuscle(g.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-blueGlow text-white'
                    : 'border border-bg-2 bg-bg-2 text-slate-300 hover:bg-bg-3'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {isLoading && <Spinner />}
        {isError && (
          <p className="rounded-lg bg-dangerRed/10 px-3 py-2 text-sm text-dangerRed">
            {t('exercises.loadingError')}
          </p>
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={Dumbbell}
            title={t('exercises.emptyState')}
            description={
              search || muscles.length
                ? t('exercises.noResults')
                : t('exercises.emptyStateHint')
            }
          />
        )}

        {data && data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {data.map((ex) => (
              <li key={ex.id}>
                <button
                  onClick={() => setDetail(ex)}
                  className="flex w-full items-center gap-3 rounded-xl border border-bg-2 bg-bg-1 px-3.5 py-3 text-left transition hover:border-bg-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{ex.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {muscleGroupLabel(ex.muscle_group)} ·{' '}
                      {ex.owner_id !== null ? (
                        <span className="text-amber-400">{t('exercises.custom')}</span>
                      ) : (
                        t('exercises.wger')
                      )}
                    </p>
                  </div>
                  <MuscleGroupBadge group={ex.muscle_group} />
                  <ChevronRight size={18} className="text-slate-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AppShell>

      <Fab onClick={openCreate} label={t('exercises.newExercise')} />

      <ExerciseFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        exercise={editing}
        onSubmit={handleSubmit}
        submitting={createMut.isPending || updateMut.isPending}
        error={formError}
      />

      <ExerciseDetailModal
        exercise={detail}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={(ex) => {
          setDetail(null);
          setDeleting(ex);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title={t('exercises.deleteConfirm')}
        message={`"${deleting?.name}" ${t('common.close')}.`}
        confirmLabel={t('common.delete')}
        danger
        loading={deleteMut.isPending}
        error={deleteError}
      />
    </>
  );
}
