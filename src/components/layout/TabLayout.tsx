import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * Layout for the four main tabs (schede, esercizi, storico, profilo).
 * Centers the app column and reserves bottom space for the fixed nav.
 */
export function TabLayout() {
  return (
    <div className="mx-auto min-h-full w-full max-w-md bg-bg-0 flex flex-col">
      {/* Dynamic padding bottom to prevent content overlap with home indicator */}
      <div 
        className="flex-1"
        style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
