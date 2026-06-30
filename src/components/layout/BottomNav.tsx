import { NavLink } from 'react-router-dom';
import { Dumbbell, ListChecks, BarChart3, User, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScroll } from '@/lib/ScrollContext';

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
  const { scrollToTop } = useScroll();

  return (
    /* Outer container: sits in the safe area, fills width */
    <div
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-center px-4"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/*
        Liquid-glass pill — iOS 26 style:
        - Heavy backdrop blur
        - Stronger white tint (~6 %)
        - Two-layer border: top bright glint + outer muted ring
        - Diffuse shadow to "lift" the pill off the page
      */}
      <nav
        className="flex w-full items-center justify-around rounded-[2rem] px-2 py-2 mb-2"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0.06) 100%)',
          backdropFilter: 'blur(40px) saturate(220%)',
          WebkitBackdropFilter: 'blur(40px) saturate(220%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow:
            'inset 0 1px 2px rgba(255, 255, 255, 0.3), ' +
            'inset 0 -1px 1px rgba(0, 0, 0, 0.3), ' +
            '0 4px 12px rgba(0, 0, 0, 0.25), ' +
            '0 16px 48px rgba(0, 0, 0, 0.45)',
        }}
      >
        {TABS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={(e) => {
              const target = e.currentTarget;
              if (target.getAttribute('aria-current') === 'page') {
                e.preventDefault();
                scrollToTop();
              }
            }}
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
