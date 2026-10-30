import { useEffect, useState } from 'react';

import { secondsUntil } from '../domain/verificationCode';

const TICK_MS = 1000;

export interface Countdown {
  /** Whole seconds left; 0 once the deadline has passed. */
  secondsLeft: number;
  /** Starts again from `seconds`. */
  restart: (seconds: number) => void;
}

/**
 * A one-second countdown measured against the clock rather than by counting ticks, so time spent in
 * the background is counted too. Stops ticking at zero.
 */
export function useCountdown(initialSeconds: number): Countdown {
  const [deadline, setDeadline] = useState(() => Date.now() + initialSeconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);

  return {
    secondsLeft: secondsUntil(deadline, now),
    restart: (seconds) => {
      const current = Date.now();
      setNow(current);
      setDeadline(current + seconds * 1000);
    },
  };
}
