import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MoreVertical, Copy, Archive, Trash2, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MuscleGroupBadge } from '@/components/ui/MuscleGroupBadge';
import type { PlanListItem } from './hooks';
import { useSwipeAction } from '@/hooks/useSwipeAction';
import { useToggleFavorite } from './hooks';

interface PlanCardProps {
  plan: PlanListItem;
  onDuplicate: (plan: PlanListItem) => void;
  onArchive: (plan: PlanListItem) => void;
  onDelete: (plan: PlanListItem) => void;
}

export function PlanCard({ plan, onDuplicate, onArchive, onDelete }: PlanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleFavMut = useToggleFavorite();

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const { translateX, isSwiping, swipeHandlers } = useSwipeAction({
    onSwipeLeft: () => {
      onDelete(plan);
    },
    onSwipeRight: () => {
      toggleFavMut.mutate({ id: plan.id, isFavorite: !plan.is_favorite });
    },
  });

  const open = () => navigate(`/plans/${plan.id}`);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe actions behind the card */}
      <div className="absolute inset-0 flex justify-between rounded-2xl bg-bg-0 pointer-events-none">
        {/* Left side (Favorite - Star) */}
        <div
          className="flex w-1/2 items-center justify-start bg-amber-500/10 px-5 text-amber-400 transition-opacity duration-150"
          style={{ opacity: translateX > 15 ? 1 : 0 }}
        >
          <Star size={20} fill={translateX > 75 ? 'currentColor' : 'none'} className="transition-transform duration-100" style={{ transform: `scale(${Math.min(1.2, 0.6 + translateX / 100)})` }} />
        </div>

        {/* Right side (Delete - Trash) */}
        <div
          className="flex w-1/2 items-center justify-end bg-dangerRed/10 px-5 text-dangerRed transition-opacity duration-150"
          style={{ opacity: translateX < -15 ? 1 : 0 }}
        >
          <Trash2 size={20} className="transition-transform duration-100" style={{ transform: `scale(${Math.min(1.2, 0.6 + Math.abs(translateX) / 100)})` }} />
        </div>
      </div>

      {/* Main Card Element */}
      <div
        {...swipeHandlers}
        className={`relative rounded-2xl border border-bg-2 bg-gradient-to-br from-bg-1 to-bg-2 p-4 select-none ${
          isSwiping ? '' : 'transition-transform duration-200'
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          touchAction: 'pan-y', // enables vertical page scroll while swiping horizontally
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <button onClick={open} className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-base font-bold text-slate-100">{plan.name}</p>
              {plan.is_favorite && (
                <Star size={14} fill="#fbbf24" className="text-amber-400 flex-none" />
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {plan.exerciseCount} {plan.exerciseCount === 1 ? t('plans.exercise') : t('plans.exercises')}
            </p>
          </button>

          <div ref={menuRef} className="relative flex items-center gap-1">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t('plans.optionsMenuLabel')}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-bg-3 hover:text-slate-100"
            >
              <MoreVertical size={18} />
            </button>
            <button
              onClick={open}
              aria-label={t('plans.openPlanLabel')}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-3 text-blueSoft"
            >
              <ChevronRight size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-bg-3 bg-bg-2 shadow-xl">
                <MenuItem icon={Copy} labelKey="plans.duplicatePlan" onClick={() => { setMenuOpen(false); onDuplicate(plan); }} />
                <MenuItem icon={Archive} labelKey="plans.archivePlan" onClick={() => { setMenuOpen(false); onArchive(plan); }} />
                <MenuItem
                  icon={Trash2}
                  labelKey="common.delete"
                  danger
                  onClick={() => { setMenuOpen(false); onDelete(plan); }}
                />
              </div>
            )}
          </div>
        </div>

        {plan.muscles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {plan.muscles.map((m) => (
              <MuscleGroupBadge key={m} group={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  labelKey,
  onClick,
  danger,
}: {
  icon: typeof Copy;
  labelKey: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-bg-3 ${
        danger ? 'text-dangerRed' : 'text-slate-200'
      }`}
    >
      <Icon size={16} />
      {t(labelKey)}
    </button>
  );
}
