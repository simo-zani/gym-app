import { useEffect, useState, useRef } from 'react';
import { playCountdownTick } from './audio';

/**
 * Countdown hook based on Date.now() anchor — drift-free.
 * Plays ticks automatically at 10s warning and last 5s countdown.
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
  isPaused?: boolean,
  pausedSecondsLeft?: number,
): number {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const firedRef = useRef(false);
  const lastTickRef = useRef<number>(-1);

  // If paused, immediately set the countdown to the paused value
  useEffect(() => {
    if (isPaused && pausedSecondsLeft !== undefined) {
      setSecondsLeft(pausedSecondsLeft);
    }
  }, [isPaused, pausedSecondsLeft]);

  useEffect(() => {
    if (isPaused) return;

    if (!active || targetEpochMs === null) {
      setSecondsLeft(0);
      firedRef.current = false;
      lastTickRef.current = -1;
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
      const timeLeft = Math.ceil(ms / 1000);
      setSecondsLeft(timeLeft);

      // Play tick sounds on state update transitions
      if (lastTickRef.current !== timeLeft) {
        lastTickRef.current = timeLeft;
        if (timeLeft === 10) {
          playCountdownTick(false); // lower warning beep
        } else if (timeLeft <= 5 && timeLeft >= 1) {
          playCountdownTick(true); // higher warning beeps
        }
      }
    };

    tick(); // immediate first tick
    const id = setInterval(tick, 100);
    return () => {
      clearInterval(id);
      lastTickRef.current = -1;
    };
  }, [active, targetEpochMs, isPaused]);

  return isPaused && pausedSecondsLeft !== undefined ? pausedSecondsLeft : secondsLeft;
}

/** Format seconds as MM:SS */
export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
