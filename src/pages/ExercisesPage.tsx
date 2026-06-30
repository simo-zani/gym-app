import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Dumbbell, ChevronRight, Trash2 } from 'lucide-react';
import { useSwipeAction } from '@/hooks/useSwipeAction';
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
  const [isSticky, setIsSticky] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!searchRef.current) return;
    const scrollContainer = searchRef.current.closest('[class*="overflow-y-auto"]') as HTMLElement;
    if (!scrollContainer) return;
    scrollContainerRef.current = scrollContainer;

    const handleScroll = () => {
      const searchTop = searchRef.current?.getBoundingClientRect().top ?? 0;
      setIsSticky(searchTop <= 0);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

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
      setFormError(err instanceof Error ? err.message : t('common.unexpectedError'));
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
      <AppShell>
        {/* Title - scrollable, goes away when you scroll */}
        <div className="mb-4 border-b border-bg-2 pb-4">
          <h1 className="text-xl font-extrabold text-slate-100">{t('exercises.title')}</h1>
          {data && <p className="mt-0.5 text-xs text-slate-400">{data.length} {t('exercises.exerciseCountSubtitle')}</p>}
        </div>

        {/* Search - Liquid glass + sticky (stays on top) */}
        <div
          ref={searchRef}
          className="sticky top-0 z-30 mx-auto flex items-center gap-2 rounded-xl backdrop-blur transition-all duration-300"
          style={{
            width: isSticky && !isFocused ? '90%' : '100%',
            maxWidth: isSticky && !isFocused ? '320px' : 'none',
            marginBottom: isSticky && !isFocused ? '0.5rem' : '0.75rem',
            marginTop: isSticky && !isFocused ? '0.5rem' : '0',
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: isSticky && !isFocused ? '0.5rem' : '0.625rem',
            paddingBottom: isSticky && !isFocused ? '0.5rem' : '0.625rem',
            height: isSticky && !isFocused ? '2.25rem' : 'auto',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <Search size={isSticky && !isFocused ? 16 : 18} className="text-slate-500 flex-shrink-0 transition-all" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('exercises.searchPlaceholder')}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Gradient fade in - content fades in below search bar */}
        <div
          className="h-3 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(6,11,26,0.8), transparent)',
          }}
        />

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
          <ul className="flex flex-col gap-2 pb-24">
            {data.map((ex) => (
              <li key={ex.id}>
                <SwipeableExerciseItem
                  ex={ex}
                  onDetail={setDetail}
                  onDelete={setDeleting}
                />
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
        message={`"${deleting?.name}" sarà eliminato definitivamente.`}
        confirmLabel={t('common.delete')}
        danger
        loading={deleteMut.isPending}
        error={deleteError}
      />
    </>
  );
}

function SwipeableExerciseItem({
  ex,
  onDetail,
  onDelete,
}: {
  ex: Exercise;
  onDetail: (ex: Exercise) => void;
  onDelete: (ex: Exercise) => void;
}) {
  const { t } = useTranslation();
  const isCustom = ex.owner_id !== null;

  const { translateX, isSwiping, swipeHandlers } = useSwipeAction({
    onSwipeLeft: isCustom ? () => onDelete(ex) : undefined,
  });

  return (
    <div className="relative overflow-hidden rounded-xl">
      {isCustom && (
        <div className="absolute inset-0 flex justify-end rounded-xl bg-bg-0 pointer-events-none">
          <div
            className="flex items-center justify-end bg-dangerRed/10 px-5 text-dangerRed transition-opacity duration-150"
            style={{ opacity: translateX < -15 ? 1 : 0 }}
          >
            <Trash2 size={18} className="transition-transform duration-100" style={{ transform: `scale(${Math.min(1.2, 0.6 + Math.abs(translateX) / 100)})` }} />
          </div>
        </div>
      )}

      <div
        {...(isCustom ? swipeHandlers : {})}
        className={`relative flex w-full items-center gap-3 rounded-xl border border-bg-2 bg-bg-1 px-3.5 py-3 text-left transition select-none ${
          isSwiping ? '' : 'transition-transform duration-200 hover:border-bg-3'
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          touchAction: 'pan-y',
        }}
      >
        <button
          onClick={() => onDetail(ex)}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">{ex.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {muscleGroupLabel(ex.muscle_group)} ·{' '}
              {isCustom ? (
                <span className="text-amber-400">{t('exercises.custom')}</span>
              ) : (
                t('exercises.wger')
              )}
            </p>
          </div>
          <MuscleGroupBadge group={ex.muscle_group} />
          <ChevronRight size={18} className="text-slate-500 flex-none" />
        </button>
      </div>
    </div>
  );
}
