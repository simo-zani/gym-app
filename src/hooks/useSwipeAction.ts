import { TouchEvent, useState } from 'react';

interface SwipeActionProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipeAction({
  onSwipeLeft,
  onSwipeRight,
  threshold = 85,
}: SwipeActionProps) {
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsSwiping(true);
  }

  function onTouchMove(e: TouchEvent) {
    if (startX === null || startY === null || !isSwiping) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    // Prevent horizontal swiping from triggering if the user is clearly scrolling vertically
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10 && translateX === 0) {
      setIsSwiping(false);
      return;
    }

    // Restrict swipe direction depending on available handlers
    if (diffX < 0 && !onSwipeLeft) return;
    if (diffX > 0 && !onSwipeRight) return;

    // Add elastic dampening beyond threshold
    let targetX = diffX;
    if (Math.abs(diffX) > threshold) {
      const extra = Math.abs(diffX) - threshold;
      const sign = diffX > 0 ? 1 : -1;
      targetX = sign * (threshold + extra * 0.35);
    }

    setTranslateX(targetX);
  }

  function onTouchEnd() {
    setIsSwiping(false);
    if (startX === null) return;

    if (translateX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (translateX > threshold && onSwipeRight) {
      onSwipeRight();
    }

    // Reset offsets
    setTranslateX(0);
    setStartX(null);
    setStartY(null);
  }

  return {
    translateX,
    isSwiping,
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
