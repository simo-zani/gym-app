import { Plus } from 'lucide-react';

interface FabProps {
  onClick: () => void;
  label: string;
}

/**
 * Floating "+" action button, anchored to the bottom-right of the centered
 * app column, sitting above the bottom nav. The wrapper mirrors the
 * `mx-auto max-w-md` layout so the button lines up with the content edge.
 */
export function Fab({ onClick, label }: FabProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md justify-end px-4 pb-32">
      <button
        onClick={onClick}
        aria-label={label}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blueGlow text-white shadow-lg shadow-blueGlow/40 transition active:scale-95 hover:bg-blueSoft"
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
