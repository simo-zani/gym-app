import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Fab } from '@/components/ui/Fab';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PlanCard } from '@/features/plans/PlanCard';
import {
  usePlans,
  useCreatePlan,
  useDeletePlan,
  useDuplicatePlan,
  useUpdatePlan,
  type PlanListItem,
} from '@/features/plans/hooks';

const nameSchema = (t: (key: string) => string) =>
  z.object({ name: z.string().min(1, t('auth.validationNameRequired')) });
type NameForm = z.infer<ReturnType<typeof nameSchema>>;

export function PlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePlans();
  const createMut = useCreatePlan();
  const duplicateMut = useDuplicatePlan();
  const archiveMut = useUpdatePlan();
  const deleteMut = useDeletePlan();

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PlanListItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NameForm>({ resolver: zodResolver(nameSchema(t)) });

  function openCreate() {
    reset({ name: '' });
    setCreateError(null);
    setCreateOpen(true);
  }

  const submitCreate = handleSubmit(async ({ name }) => {
    setCreateError(null);
    try {
      const plan = await createMut.mutateAsync(name);
      setCreateOpen(false);
      navigate(`/plans/${plan.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('common.unexpectedError'));
    }
  });

  return (
    <>
      <AppShell
        title={t('plans.myPlans')}
        subtitle={data ? `${data.length} ${data.length === 1 ? t('plans.exercise') : t('plans.exercises_plural')}` : undefined}
      >
        {isLoading && <Spinner />}
        {isError && (
          <p className="rounded-lg bg-dangerRed/10 px-3 py-2 text-sm text-dangerRed">
            {t('common.loadingError')}
          </p>
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title={t('plans.emptyState')}
            description={t('plans.emptyStateHint')}
            action={<Button onClick={openCreate}>{t('plans.createPlan')}</Button>}
          />
        )}

        {data && data.length > 0 && (
          <div className="flex flex-col gap-3">
            {data.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDuplicate={(p) => duplicateMut.mutate(p.id)}
                onArchive={(p) => archiveMut.mutate({ id: p.id, is_archived: true })}
                onDelete={(p) => setDeleting(p)}
              />
            ))}
          </div>
        )}
      </AppShell>

      <Fab onClick={openCreate} label={t('plans.newPlan')} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('plans.newPlan')}>
        <form onSubmit={submitCreate} className="flex flex-col gap-4">
          <Input
            id="plan-name"
            label={t('plans.name')}
            placeholder={t('plans.namePlaceholder')}
            autoFocus
            error={errors.name?.message}
            {...register('name')}
          />
          {createError && (
            <p className="rounded-lg bg-dangerRed/10 px-3 py-2 text-sm text-dangerRed">
              {createError}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={createMut.isPending} className="flex-1">
              {t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteMut.mutateAsync(deleting.id);
          setDeleting(null);
        }}
        title={t('plans.deleteConfirm')}
        message={`"${deleting?.name}" ${t('plans.deleteConfirmWarning')}`}
        confirmLabel={t('common.delete')}
        danger
        loading={deleteMut.isPending}
      />
    </>
  );
}
