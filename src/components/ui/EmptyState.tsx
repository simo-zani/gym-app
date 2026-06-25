import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-bg-3 bg-bg-1/50 px-6 py-12 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-2 text-slate-500">
          <Icon size={26} />
        </div>
      )}
      <p className="text-base font-semibold text-slate-200">{title}</p>
      {description && <p className="max-w-xs text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
