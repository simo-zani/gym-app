import { useEffect, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Slide-up sheet anchored to the bottom — touch-friendly for the
 * plan-exercise configuration (see mockup screen 3).
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
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
        className="absolute inset-0 bg-bg-0/65 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-bg-3 bg-bg-1 px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-bg-3" />
        {title && <h2 className="mb-4 text-lg font-bold text-slate-100">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
