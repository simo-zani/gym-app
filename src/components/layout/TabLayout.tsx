import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useScroll } from '@/lib/ScrollContext';
import { BottomNav } from './BottomNav';

/**
 * Layout for the four main tabs (schede, esercizi, storico, profilo).
 * Fixed viewport: scrollable content + fixed bottom nav (iOS style).
 */
export function TabLayout() {
  const { setScrollRef, scrollToTop } = useScroll();

  // Tap on status bar / Dynamic Island area → scroll to top (native iOS behavior)
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Status bar zone: top ~54px (safe area inset + tap target)
      if (touch && touch.clientY < 54) {
        scrollToTop();
      }
    };
    document.addEventListener('touchstart', handler, { passive: true });
    return () => document.removeEventListener('touchstart', handler);
  }, [scrollToTop]);

  return (
    <div className="mx-auto h-screen w-full max-w-md flex flex-col bg-bg-0">
      {/* Scrollable content area */}
      <div ref={setScrollRef} className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* iOS-style top fade — fades scrolling content below sticky elements */}
      <div
        className="pointer-events-none fixed inset-x-0 z-10"
        style={{
          top: 0,
          height: '5rem',
          background: 'linear-gradient(to bottom, #060b1a 0%, transparent 100%)',
        }}
      />

      {/* iOS-style bottom fade — fades content above the BottomNav */}
      <div
        className="pointer-events-none fixed inset-x-0 z-30"
        style={{
          bottom: 0,
          height: '9rem',
          background: 'linear-gradient(to top, #060b1a 0%, transparent 100%)',
        }}
      />

      {/* Fixed bottom nav */}
      <BottomNav />
    </div>
  );
}
