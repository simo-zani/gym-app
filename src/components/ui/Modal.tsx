import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  stickyContent?: ReactNode;
  children: ReactNode;
}

/**
 * Centered dialog used for forms (new exercise) and confirmations.
 * For the plan-exercise config we use the BottomSheet instead.
 */
export function Modal({ open, onClose, title, stickyContent, children }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-bg-0/70 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-bg-3 bg-bg-1 shadow-2xl animate-modal-in flex flex-col max-h-[82vh]">
        {/* Fixed header: title + close button */}
        {title && (
          <div className="flex items-center justify-between flex-shrink-0 px-5 pt-5 pb-3">
            <h2 className="text-lg font-bold text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Chiudi"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-bg-2 hover:text-slate-100"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {/* Sticky non-scrollable content (e.g. muscle graphic + info tags) */}
        {stickyContent && (
          <div className="flex-shrink-0 px-5 pt-2 pb-3">
            {stickyContent}
          </div>
        )}
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
