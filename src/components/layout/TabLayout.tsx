import { Outlet } from 'react-router-dom';
import { useScroll } from '@/lib/ScrollContext';
import { BottomNav } from './BottomNav';

/**
 * Layout for the four main tabs (schede, esercizi, storico, profilo).
 * Fixed viewport: scrollable content + fixed bottom nav (iOS style).
 */
export function TabLayout() {
  const { setScrollRef } = useScroll();

  return (
    <div className="mx-auto h-screen w-full max-w-md flex flex-col bg-bg-0">
      {/* Scrollable content area */}
      <div ref={setScrollRef} className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Gradient fade before bottom nav (depth effect) */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-20 mx-auto h-16 w-full max-w-md"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))',
        }}
      />

      {/* Fixed bottom nav */}
      <BottomNav />
    </div>
  );
}
