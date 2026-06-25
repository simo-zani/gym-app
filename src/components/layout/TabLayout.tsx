import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * Layout for the four main tabs (schede, esercizi, storico, profilo).
 * Centers the app column and reserves bottom space for the fixed nav.
 */
export function TabLayout() {
  return (
    <div className="mx-auto min-h-full w-full max-w-md bg-bg-0">
      {/* pb clears the fixed BottomNav (~64px + safe area) */}
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
