import { useEffect, useState, useRef } from 'react';

/**
 * Countdown hook based on Date.now() anchor — drift-free.
 *
 * @param active  Whether the timer should tick.
 * @param targetEpochMs  The epoch timestamp (ms) when the timer reaches 0.
 * @param onEnd   Called exactly once when the countdown reaches 0.
 * @returns secondsLeft — always >= 0.
 */
export function useCountdown(
  active: boolean,
  targetEpochMs: number | null,
  onEnd: () => void,
): number {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active || targetEpochMs === null) {
      setSecondsLeft(0);
      firedRef.current = false;
      return;
    }

    firedRef.current = false;

    const tick = () => {
      const ms = targetEpochMs - Date.now();
      if (ms <= 0) {
        setSecondsLeft(0);
        if (!firedRef.current) {
          firedRef.current = true;
          onEndRef.current();
        }
        return;
      }
      setSecondsLeft(Math.ceil(ms / 1000));
    };

    tick(); // immediate first tick
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [active, targetEpochMs]);

  return secondsLeft;
}

/** Format seconds as MM:SS */
export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
