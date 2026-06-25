import { NavLink } from 'react-router-dom';
import { Dumbbell, ListChecks, BarChart3, User, type LucideIcon } from 'lucide-react';

interface NavTab {
  to: string;
  label: string;
  icon: LucideIcon;
}

const TABS: NavTab[] = [
  { to: '/', label: 'Schede', icon: Dumbbell },
  { to: '/exercises', label: 'Esercizi', icon: ListChecks },
  { to: '/history', label: 'Storico', icon: BarChart3 },
  { to: '/profile', label: 'Profilo', icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-around border-t border-bg-2 bg-bg-1/95 px-2 pb-3 pt-2 backdrop-blur">
      {TABS.map(({ to, label, icon: Icon }) => (
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
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
