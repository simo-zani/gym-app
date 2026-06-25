import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Play, Plus, MoreVertical, Pencil, Copy, Archive, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddExerciseModal } from '@/features/plans/AddExerciseModal';
import { PlanExerciseConfigSheet } from '@/features/plans/PlanExerciseConfigSheet';
import { SortableExerciseRow } from '@/features/plans/SortableExerciseRow';
import {
  usePlan,
  usePlanExercises,
  useAddPlanExercise,
  useUpdatePlanExercise,
  useDeletePlanExercise,
  useReorderPlanExercises,
  useUpdatePlan,
  useDeletePlan,
  useDuplicatePlan,
  type PlanExerciseInput,
} from '@/features/plans/hooks';
import type { Exercise, PlanExerciseWithExercise } from '@/types/db';

const renameSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  notes: z.string().optional(),
});
type RenameForm = z.infer<typeof renameSchema>;

interface ConfigTarget {
  exerciseId: string;
  exerciseName: string;
  initial: PlanExerciseWithExercise | null;
}

export function PlanEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const planQuery = usePlan(id);
  const exercisesQuery = usePlanExercises(id);

  const addMut = useAddPlanExercise(id!);
  const updateItemMut = useUpdatePlanExercise(id!);
  const deleteItemMut = useDeletePlanExercise(id!);
  const reorderMut = useReorderPlanExercises(id!);
  const updatePlanMut = useUpdatePlan();
  const deletePlanMut = useDeletePlan();
  const duplicateMut = useDuplicatePlan();

  // Local order mirrors the query so drag&drop can be optimistic.
  const [order, setOrder] = useState<PlanExerciseWithExercise[]>([]);
  useEffect(() => {
    if (exercisesQuery.data) setOrder(exercisesQuery.data);
  }, [exercisesQuery.data]);

  const [addOpen, setAddOpen] = useState(false);
  const [config, setConfig] = useState<ConfigTarget | null>(null);
  const [deletingItem, setDeletingItem] = useState<PlanExerciseWithExercise | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletePlanOpen, setDeletePlanOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RenameForm>({ resolver: zodResolver(renameSchema) });

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((i) => i.id === active.id);
    const newIndex = order.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    reorderMut.mutate(next.map((i) => i.id));
  }

  function openRename() {
    reset({ name: planQuery.data?.name ?? '', notes: planQuery.data?.notes ?? '' });
    setRenameOpen(true);
  }

  const submitRename = handleSubmit(async ({ name, notes }) => {
    await updatePlanMut.mutateAsync({ id: id!, name, notes: notes?.trim() || null });
    setRenameOpen(false);
  });

  function onSelectExercise(ex: Exercise) {
    setAddOpen(false);
    setConfig({ exerciseId: ex.id, exerciseName: ex.name, initial: null });
  }

  function onEditItem(item: PlanExerciseWithExercise) {
    setConfig({
      exerciseId: item.exercise_id,
      exerciseName: item.exercise?.name ?? 'Esercizio',
      initial: item,
    });
  }

  async function onConfigSubmit(input: PlanExerciseInput) {
    if (config?.initial) {
      await updateItemMut.mutateAsync({ id: config.initial.id, ...input });
    } else {
      await addMut.mutateAsync(input);
    }
    setConfig(null);
  }

  if (planQuery.isLoading) {
    return (
      <div className="mx-auto min-h-full w-full max-w-md bg-bg-0">
        <Spinner />
      </div>
    );
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <div className="mx-auto min-h-full w-full max-w-md bg-bg-0 p-6 text-center">
        <p className="text-sm text-dangerRed">Scheda non trovata.</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
          Torna alle schede
        </Button>
      </div>
    );
  }

  const plan = planQuery.data;

  return (
    <div className="mx-auto min-h-full w-full max-w-md bg-bg-0">
      <AppShell
        onBack={() => navigate('/')}
        title={
          <button onClick={openRename} className="flex items-center gap-1.5 text-left">
            <span className="truncate text-lg font-extrabold text-slate-100">{plan.name}</span>
            <Pencil size={15} className="flex-none text-slate-500" />
          </button>
        }
        subtitle="Editor scheda"
        action={
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Opzioni scheda"
              className="rounded-lg p-2 text-slate-300 transition hover:bg-bg-2 hover:text-slate-100"
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-bg-3 bg-bg-2 shadow-xl">
                <MenuItem
                  icon={Copy}
                  label="Duplica"
                  onClick={async () => {
                    setMenuOpen(false);
                    const copy = await duplicateMut.mutateAsync(plan.id);
                    navigate(`/plans/${copy.id}`);
                  }}
                />
                <MenuItem
                  icon={Archive}
                  label="Archivia"
                  onClick={async () => {
                    setMenuOpen(false);
                    await updatePlanMut.mutateAsync({ id: plan.id, is_archived: true });
                    navigate('/');
                  }}
                />
                <MenuItem
                  icon={Trash2}
                  label="Elimina"
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    setDeletePlanOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        }
        footer={
          <Button
            variant="success"
            className="w-full py-4 text-base"
            disabled
            title="Disponibile nella Fase 3"
          >
            <Play size={18} /> Inizia allenamento
          </Button>
        }
      >
        {plan.notes && (
          <p className="mb-3 rounded-xl border border-bg-2 bg-bg-1 px-3.5 py-2.5 text-sm text-slate-300">
            {plan.notes}
          </p>
        )}

        <p className="mb-3 px-1 text-xs text-slate-500">
          Trascina ☰ per riordinare · tocca ✎ per configurare
        </p>

        {exercisesQuery.isLoading && <Spinner />}

        {order.length === 0 && !exercisesQuery.isLoading && (
          <p className="rounded-xl border border-dashed border-bg-3 bg-bg-1/50 px-4 py-8 text-center text-sm text-slate-400">
            Nessun esercizio nella scheda.
          </p>
        )}

        {order.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={order.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {order.map((item, index) => (
                  <SortableExerciseRow
                    key={item.id}
                    item={item}
                    index={index}
                    onEdit={onEditItem}
                    onDelete={setDeletingItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <button
          onClick={() => setAddOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blueSoft/40 bg-blueGlow/5 py-3.5 text-sm font-bold text-blueSoft transition hover:bg-blueGlow/10"
        >
          <Plus size={18} /> Aggiungi esercizio
        </button>
      </AppShell>

      {/* Add exercise → pick from catalog */}
      <AddExerciseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSelect={onSelectExercise}
      />

      {/* Config sheet (add or edit) */}
      {config && (
        <PlanExerciseConfigSheet
          open={Boolean(config)}
          onClose={() => setConfig(null)}
          exerciseId={config.exerciseId}
          exerciseName={config.exerciseName}
          initial={config.initial}
          onSubmit={onConfigSubmit}
          submitting={addMut.isPending || updateItemMut.isPending}
        />
      )}

      {/* Rename / notes */}
      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Modifica scheda">
        <form onSubmit={submitRename} className="flex flex-col gap-4">
          <Input id="plan-rename" label="Nome" error={errors.name?.message} {...register('name')} />
          <Textarea id="plan-notes" label="Note (opzionale)" {...register('notes')} />
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)} className="flex-1">
              Annulla
            </Button>
            <Button type="submit" loading={updatePlanMut.isPending} className="flex-1">
              Salva
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove exercise from plan */}
      <ConfirmDialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={async () => {
          if (!deletingItem) return;
          await deleteItemMut.mutateAsync(deletingItem.id);
          setDeletingItem(null);
        }}
        title="Rimuovere l'esercizio?"
        message={`"${deletingItem?.exercise?.name ?? 'Esercizio'}" verrà rimosso dalla scheda.`}
        confirmLabel="Rimuovi"
        danger
        loading={deleteItemMut.isPending}
      />

      {/* Delete whole plan */}
      <ConfirmDialog
        open={deletePlanOpen}
        onClose={() => setDeletePlanOpen(false)}
        onConfirm={async () => {
          await deletePlanMut.mutateAsync(plan.id);
          navigate('/');
        }}
        title="Eliminare la scheda?"
        message={`"${plan.name}" e i suoi esercizi verranno eliminati.`}
        confirmLabel="Elimina"
        danger
        loading={deletePlanMut.isPending}
      />
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-bg-3 ${
        danger ? 'text-dangerRed' : 'text-slate-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
