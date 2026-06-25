import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MoreVertical, Copy, Archive, Trash2 } from 'lucide-react';
import { MuscleGroupBadge } from '@/components/ui/MuscleGroupBadge';
import type { PlanListItem } from './hooks';

interface PlanCardProps {
  plan: PlanListItem;
  onDuplicate: (plan: PlanListItem) => void;
  onArchive: (plan: PlanListItem) => void;
  onDelete: (plan: PlanListItem) => void;
}

export function PlanCard({ plan, onDuplicate, onArchive, onDelete }: PlanCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const open = () => navigate(`/plans/${plan.id}`);

  return (
    <div className="relative rounded-2xl border border-bg-2 bg-gradient-to-br from-bg-1 to-bg-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <button onClick={open} className="min-w-0 flex-1 text-left">
          <p className="truncate text-base font-bold text-slate-100">{plan.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {plan.exerciseCount} {plan.exerciseCount === 1 ? 'esercizio' : 'esercizi'}
          </p>
        </button>

        <div ref={menuRef} className="relative flex items-center gap-1">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Opzioni scheda"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-bg-3 hover:text-slate-100"
          >
            <MoreVertical size={18} />
          </button>
          <button
            onClick={open}
            aria-label="Apri scheda"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-3 text-blueSoft"
          >
            <ChevronRight size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-bg-3 bg-bg-2 shadow-xl">
              <MenuItem icon={Copy} label="Duplica" onClick={() => { setMenuOpen(false); onDuplicate(plan); }} />
              <MenuItem icon={Archive} label="Archivia" onClick={() => { setMenuOpen(false); onArchive(plan); }} />
              <MenuItem
                icon={Trash2}
                label="Elimina"
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
