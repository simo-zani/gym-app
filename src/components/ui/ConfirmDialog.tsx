import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  error?: string | null;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Conferma',
  danger = false,
  loading = false,
  error = null,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message && <p className="mb-4 text-sm text-slate-300">{message}</p>}
      {error && (
        <p className="mb-4 rounded-lg bg-dangerRed/10 px-3 py-2 text-sm text-dangerRed">{error}</p>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
          Annulla
        </Button>
        <Button
          type="button"
          variant={danger ? 'danger' : 'primary'}
          loading={loading}
          onClick={onConfirm}
          className="flex-1"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
