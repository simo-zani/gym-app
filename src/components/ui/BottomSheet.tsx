import { useEffect, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Optional content to pin above the scrollable area (e.g. mode tabs). */
  stickyHeader?: ReactNode;
  children: ReactNode;
}

/**
 * Slide-up sheet anchored to the bottom — touch-friendly for the
 * plan-exercise configuration (see mockup screen 3).
 *
 * The sheet has a fixed max-height and an internal scrollable body so that
 * the header / sticky content never moves when new items are added.
 */
export function BottomSheet({ open, onClose, title, stickyHeader, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-bg-0/65 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet: fixed max-height so it doesn't grow beyond 90 dvh */}
      <div
        className="relative z-10 flex w-full max-w-md flex-col rounded-t-3xl border-t border-bg-3 bg-bg-1 shadow-2xl animate-sheet-in"
        style={{ maxHeight: '90dvh' }}
      >
        {/* Non-scrollable header area */}
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-bg-3" />
          {title && <h2 className="mb-4 text-lg font-bold text-slate-100">{title}</h2>}
          {stickyHeader}
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-5"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
