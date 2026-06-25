import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface AppShellProps {
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
  // Sticky CTA rendered at the bottom (e.g. "Inizia allenamento" in the editor).
  footer?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

/**
 * Page frame: top bar + scrollable content + optional sticky footer.
 * Width centering and the bottom nav are owned by the layout (TabLayout).
 */
export function AppShell({
  title,
  subtitle,
  action,
  onBack,
  footer,
  children,
  contentClassName = '',
}: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      {(title || onBack || action) && (
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-bg-2 bg-bg-0/90 px-4 py-4 backdrop-blur">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Indietro"
              className="-ml-2 rounded-lg p-2 text-slate-300 transition hover:bg-bg-2 hover:text-slate-100"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {typeof title === 'string' ? (
              <h1 className="truncate text-xl font-extrabold text-slate-100">{title}</h1>
            ) : (
              title
            )}
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <main className={`flex-1 px-4 py-5 ${contentClassName}`}>{children}</main>
      {footer && (
        <div className="sticky bottom-0 z-20 border-t border-bg-2 bg-bg-0/95 px-4 py-4 backdrop-blur">
          {footer}
        </div>
      )}
    </div>
  );
}
