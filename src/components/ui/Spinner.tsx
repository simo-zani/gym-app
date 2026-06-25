import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 text-slate-500 ${className}`}>
      <Loader2 className="animate-spin" size={24} />
    </div>
  );
}
