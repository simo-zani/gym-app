import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PlanCard } from '@/features/plans/PlanCard';
import {
  usePlans,
  useCreatePlan,
  useDeletePlan,
  type PlanListItem,
} from '@/features/plans/hooks';

const nameSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('plans.name')),
    difficulty: z.coerce.number().min(1).max(5),
  });
type NameForm = z.infer<ReturnType<typeof nameSchema>>;

export function PlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePlans();
  const createMut = useCreatePlan();
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
    reset({ name: '', difficulty: 3 });
    setCreateError(null);
    setCreateOpen(true);
  }

  const submitCreate = handleSubmit(async ({ name, difficulty }) => {
    setCreateError(null);
    try {
      const plan = await createMut.mutateAsync({ name, difficulty });
      setCreateOpen(false);
      navigate(`/plans/${plan.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('common.unexpectedError'));
    }
  });

  return (
    <>
      <AppShell>
        {/* Title - scrollable, same style as all other tab pages */}
        <div className="relative z-[20] mb-4 border-b border-bg-2 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">{t('plans.myPlans')}</h1>
            {data && (
              <p className="mt-0.5 text-xs text-slate-400">
                {data.length} {data.length === 1 ? t('plans.planCountSingular') : t('plans.planCountPlural')}
              </p>
            )}
          </div>
          <button
            onClick={openCreate}
            aria-label={t('plans.newPlan')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blueGlow/25 text-blueSoft border border-blueSoft/30 shadow-md transition-all duration-150 active:scale-120 hover:bg-blueGlow hover:text-white"
          >
            <Plus size={18} />
          </button>
        </div>
        {isLoading && <Spinner />}
        {isError && (
          <p className="rounded-lg bg-dangerRed/10 px-3 py-2 text-sm text-dangerRed">
            {t('common.error')} nel caricamento delle schede.
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

        {data && data.length > 0 && (() => {
          const favorites = data.filter((p) => p.is_favorite);
          const others = data.filter((p) => !p.is_favorite);

          return (
            <div className="flex flex-col gap-6 pb-36">
              {favorites.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
                    {t('plans.favorites')}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {favorites.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        onDelete={(p) => setDeleting(p)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <div className="flex flex-col gap-3">
                  {favorites.length > 0 && (
                    <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      {t('plans.otherPlans')}
                    </h2>
                  )}
                  <div className="flex flex-col gap-3">
                    {others.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        onDelete={(p) => setDeleting(p)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </AppShell>

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
          <Select
            id="plan-difficulty"
            label={t('plans.difficulty')}
            error={errors.difficulty?.message}
            {...register('difficulty')}
          >
            <option value="1">{t('plans.difficultyLevels.1')}</option>
            <option value="2">{t('plans.difficultyLevels.2')}</option>
            <option value="3">{t('plans.difficultyLevels.3')}</option>
            <option value="4">{t('plans.difficultyLevels.4')}</option>
            <option value="5">{t('plans.difficultyLevels.5')}</option>
          </Select>
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
