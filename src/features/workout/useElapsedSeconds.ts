/**
 * useElapsedSeconds — returns a live count-up of seconds since `startMs`.
 * Ticks every second. Returns 0 if startMs is null.
 */
import { useState, useEffect } from 'react';

export function useElapsedSeconds(startMs: number | null): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startMs == null) {
      setElapsed(0);
      return;
    }

    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs]);

  return elapsed;
}

/** Format elapsed seconds as MM:SS */
export function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
