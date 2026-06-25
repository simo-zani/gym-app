import { LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';

export function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <AppShell
      title="GymApp"
      action={
        <button
          onClick={() => signOut()}
          aria-label="Logout"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-bg-2 hover:text-dangerRed"
        >
          <LogOut size={20} />
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-bg-2 bg-bg-1 p-5">
          <p className="text-sm text-slate-400">Sei loggato come</p>
          <p className="mt-1 break-all text-base font-semibold text-slate-100">
            {user?.email}
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-bg-3 bg-bg-1/50 p-5 text-center">
          <p className="text-sm text-slate-400">
            Scheletro Fase 1 attivo. Schede ed esercizi arrivano in Fase 2.
          </p>
        </div>

        <Button variant="ghost" onClick={() => signOut()}>
          Esci
        </Button>
      </div>
    </AppShell>
  );
}
