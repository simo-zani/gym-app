import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { syncNow, useSyncStatus } from '@/lib/sync';

export function SyncStatusCard() {
  const { t, i18n } = useTranslation();
  const { online, syncing, pending } = useSyncStatus();
  const lastSync = useLiveQuery(() => db.meta.get('last_sync_at'), []);

  const lastSyncLabel = lastSync?.value
    ? new Date(lastSync.value).toLocaleString(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t('sync.never');

  let statusText: string;
  let Icon = Cloud;
  let tone = 'text-green';
  if (!online) {
    statusText = t('sync.offline');
    Icon = CloudOff;
    tone = 'text-red-400';
  } else if (syncing) {
    statusText = t('sync.syncing');
    Icon = RefreshCw;
    tone = 'text-blueSoft';
  } else if (pending > 0) {
    statusText = t('sync.pending', { count: pending });
    Icon = Cloud;
    tone = 'text-amber-400';
  } else {
    statusText = t('sync.synced');
    Icon = Check;
    tone = 'text-green';
  }

  return (
    <div className="rounded-2xl border border-bg-2 bg-bg-1 p-5">
      <div className="mb-3 flex items-center gap-2 text-slate-200">
        <Cloud size={18} className="text-blueSoft" />
        <span className="text-sm font-semibold">{t('sync.title')}</span>
      </div>

      <div className="flex items-center gap-2">
        <Icon size={18} className={`${tone} ${syncing ? 'animate-spin' : ''}`} />
        <span className="text-base font-semibold text-slate-100">{statusText}</span>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {t('sync.lastSync', { time: lastSyncLabel })}
      </p>

      {!online && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{t('sync.offlineHint')}</p>
      )}

      <Button
        variant="ghost"
        className="mt-4 w-full"
        onClick={() => syncNow()}
        disabled={!online || syncing}
      >
        <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {t('sync.syncNow')}
      </Button>
    </div>
  );
}
