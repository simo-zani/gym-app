import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * Layout for the four main tabs (schede, esercizi, storico, profilo).
 * Centers the app column and reserves bottom space for the fixed nav.
 */
export function TabLayout() {
  return (
    <div className="mx-auto min-h-full w-full max-w-md bg-bg-0 flex flex-col">
      {/* Padding bottom clears: pill height (~72px) + padding (~20px) + safe area */}
      <div
        className="flex-1"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
