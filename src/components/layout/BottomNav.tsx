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
    /* Outer container: sits in the safe area, fills width */
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
    >
      {/*
        Liquid-glass pill — iOS 26 style:
        - Heavy backdrop blur
        - Stronger white tint (~6 %)
        - Two-layer border: top bright glint + outer muted ring
        - Diffuse shadow to "lift" the pill off the page
      */}
      <nav
        className="flex w-full max-w-sm items-center justify-around rounded-[2rem] px-2 py-2 mb-2"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(36px) saturate(200%)',
          WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.15), ' +
            '0 4px 6px rgba(0,0,0,0.2), ' +
            '0 12px 40px rgba(0,0,0,0.35)',
        }}
      >
        {TABS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-all duration-300 ${
                isActive
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300"
                  style={
                    isActive
                      ? {
                          background: 'rgba(96, 165, 250, 0.22)',
                          boxShadow: '0 0 12px rgba(96,165,250,0.35)',
                        }
                      : {}
                  }
                >
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
                </span>
                {t(labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
