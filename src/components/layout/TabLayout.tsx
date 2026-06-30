import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * Layout for the four main tabs (schede, esercizi, storico, profilo).
 * Fixed viewport: scrollable content + fixed bottom nav (iOS style).
 */
export function TabLayout() {
  return (
    <div className="mx-auto h-screen w-full max-w-md flex flex-col bg-bg-0">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      {/* Fixed bottom nav */}
      <BottomNav />
    </div>
  );
}
