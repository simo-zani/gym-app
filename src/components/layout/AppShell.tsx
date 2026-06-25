import type { ReactNode } from 'react';

interface AppShellProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Basic app frame: top bar + scrollable content.
 * BottomNav arrives in a later phase (Fase 2+).
 */
export function AppShell({ title, action, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-bg-0">
      {title && (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-bg-2 bg-bg-0/90 px-4 py-4 backdrop-blur">
          <h1 className="text-lg font-bold text-slate-100">{title}</h1>
          {action}
        </header>
      )}
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
