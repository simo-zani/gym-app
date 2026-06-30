import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';

export function HistoryPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="relative z-[20] mb-4 border-b border-bg-2 pb-4">
        <h1 className="text-xl font-extrabold text-slate-100">{t('history.title')}</h1>
      </div>
      <EmptyState
        icon={BarChart3}
        title={t('history.emptyState')}
        description={t('history.emptyStateHint')}
      />
    </AppShell>
  );
}
