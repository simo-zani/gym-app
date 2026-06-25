import { BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';

export function HistoryPage() {
  return (
    <AppShell title="Storico">
      <EmptyState
        icon={BarChart3}
        title="Ancora niente storico"
        description="Lo storico degli allenamenti arriva con la modalità workout (Fase 3) e i progressi (Fase 5)."
      />
    </AppShell>
  );
}
