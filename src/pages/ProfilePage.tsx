import { LogOut, Database } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { useExercises } from '@/features/exercises/hooks';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { data: exercises } = useExercises();

  const wgerCount = (exercises ?? []).filter((e) => e.owner_id === null).length;
  const customCount = (exercises ?? []).filter((e) => e.owner_id !== null).length;

  return (
    <AppShell title="Profilo">
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-bg-2 bg-bg-1 p-5">
          <p className="text-sm text-slate-400">Account</p>
          <p className="mt-1 break-all text-base font-semibold text-slate-100">{user?.email}</p>
        </div>

        <div className="rounded-2xl border border-bg-2 bg-bg-1 p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-200">
            <Database size={18} className="text-blueSoft" />
            <span className="text-sm font-semibold">Catalogo esercizi</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-bg-2 px-3 py-3">
              <p className="text-2xl font-extrabold text-slate-100">{wgerCount}</p>
              <p className="text-xs text-slate-400">da wger</p>
            </div>
            <div className="rounded-xl bg-bg-2 px-3 py-3">
              <p className="text-2xl font-extrabold text-slate-100">{customCount}</p>
              <p className="text-xs text-slate-400">personalizzati</p>
            </div>
          </div>
          {wgerCount === 0 && (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Per importare il catalogo wger esegui una tantum:{' '}
              <code className="rounded bg-bg-2 px-1.5 py-0.5 text-blueSoft">npm run seed:wger</code>{' '}
              (richiede la service role key in <code className="text-blueSoft">.env</code>).
            </p>
          )}
        </div>

        <Button variant="ghost" onClick={() => signOut()}>
          <LogOut size={16} /> Esci
        </Button>
      </div>
    </AppShell>
  );
}
