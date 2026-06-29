import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';

export function HistoryPage() {
  const { t } = useTranslation();
  return (
    <AppShell title={t('history.title')}>
      <EmptyState
        icon={BarChart3}
        title={t('history.emptyState')}
        description={t('history.emptyStateHint')}
      />
    </AppShell>
  );
}
