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

      {/* Fake layer for transparency effect - covers content before bottom nav */}
      <div
        className="pointer-events-none fixed inset-x-0 z-20 mx-auto w-full max-w-md"
        style={{
          bottom: '5rem',
          height: '5rem',
          background: 'linear-gradient(to bottom, rgba(6, 11, 26, 0), rgba(6, 11, 26, 1))',
        }}
      />

      {/* Fixed bottom nav */}
      <BottomNav />
    </div>
  );
}
