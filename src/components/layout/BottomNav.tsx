import { NavLink } from 'react-router-dom';
import { Dumbbell, ListChecks, BarChart3, User, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavTab {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

const TABS: NavTab[] = [
  { to: '/', labelKey: 'nav.plans', icon: Dumbbell },
  { to: '/exercises', labelKey: 'nav.exercises', icon: ListChecks },
  { to: '/history', labelKey: 'nav.history', icon: BarChart3 },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
];

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-around border-t border-bg-2 bg-red-600 px-2 pt-3.5 backdrop-blur"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      {TABS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-semibold transition ${
              isActive ? 'text-blueSoft' : 'text-slate-500 hover:text-slate-300'
            }`
          }
        >
          <Icon size={22} />
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
