import { LogOut, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/features/auth/useAuth';
import { useExercises } from '@/features/exercises/hooks';
import { SyncStatusCard } from '@/features/sync/SyncStatusCard';

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { data: exercises } = useExercises();

  const wgerCount = (exercises ?? []).filter((e) => e.owner_id === null).length;
  const customCount = (exercises ?? []).filter((e) => e.owner_id !== null).length;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    localStorage.setItem('gymapp-language', lang);
    i18n.changeLanguage(lang);
  };

  return (
    <AppShell>
      <div className="relative z-[20] mb-4 border-b border-bg-2 pb-4">
        <h1 className="text-xl font-extrabold text-slate-100">{t('profile.title')}</h1>
      </div>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-bg-2 bg-bg-1 p-5">
          <p className="text-sm text-slate-400">{t('profile.account')}</p>
          <p className="mt-1 break-all text-base font-semibold text-slate-100">{user?.email}</p>
        </div>

        <div className="rounded-2xl border border-bg-2 bg-bg-1 p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-200">
            <Database size={18} className="text-blueSoft" />
            <span className="text-sm font-semibold">{t('profile.exerciseCatalog')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-bg-2 px-3 py-3">
              <p className="text-2xl font-extrabold text-slate-100">{wgerCount}</p>
              <p className="text-xs text-slate-400">{t('profile.catalogSource')}</p>
            </div>
            <div className="rounded-xl bg-bg-2 px-3 py-3">
              <p className="text-2xl font-extrabold text-slate-100">{customCount}</p>
              <p className="text-xs text-slate-400">{t('profile.customExercises')}</p>
            </div>
          </div>
          {wgerCount === 0 && (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {t('profile.seedHint')}{' '}
              <code className="rounded bg-bg-2 px-1.5 py-0.5 text-blueSoft">{t('profile.seedCommand')}</code>{' '}
              ({t('profile.seedNote')} <code className="text-blueSoft">{t('profile.seedFile')}</code>).
            </p>
          )}
        </div>

        <SyncStatusCard />

        <div className="rounded-2xl border border-bg-2 bg-bg-1 p-5">
          <label className="text-sm text-slate-400">{t('profile.language')}</label>
          <Select
            value={i18n.language.split('-')[0]}
            onChange={handleLanguageChange}
            className="mt-2"
          >
            <option value="it">{t('profile.italian')}</option>
            <option value="en">{t('profile.english')}</option>
          </Select>
        </div>

        <Button variant="ghost" onClick={() => signOut()}>
          <LogOut size={16} /> {t('profile.signOut')}
        </Button>
      </div>
    </AppShell>
  );
}
