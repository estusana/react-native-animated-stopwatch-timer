import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { throttle } from './utils/throttle';

// Declare global timer functions for React Native
declare const setInterval: (callback: () => void, delay: number) => number;
declare const clearInterval: (id: number) => void;

/**
 * Optimized custom hook that handles the state for the timer
 * Enhanced with better memory management and performance optimizations
 */
const useTimer = ({
  initialTimeInMs = 0,
  onFinish = () => null,
  mode = 'stopwatch',
  intervalMs = 16,
  needHour = false,
}: {
  initialTimeInMs?: number;
  onFinish?: () => void;
  mode?: 'timer' | 'stopwatch';
  intervalMs?: number;
  needHour: boolean;
}) => {
  const direction = mode === 'timer' ? -1 : 1;
  const [elapsedInMs, setElapsedInMs] = useState(0);
  const startTime = useRef<number | null>(null);
  const pausedTime = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);

  // Memoized throttled onFinish callback to prevent unnecessary re-creations
  const throttledOnFinish = useMemo(
    () => throttle(onFinish, 100, { trailing: false }),
    [onFinish]
  );

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (intervalId.current !== null) {
        clearInterval(intervalId.current);
      }
      throttledOnFinish.cancel();
    };
  }, [throttledOnFinish]);

  useEffect(() => {
    // Ensure that the timer is reset when the initialTimeInMs changes
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTimeInMs]);

  // Memoized snapshot calculation to avoid repeated computations
  const getSnapshot = useCallback(() => {
    return Math.abs(initialTimeInMs + elapsedInMs * direction);
  }, [initialTimeInMs, elapsedInMs, direction]);

  const play = useCallback(() => {
    // Already playing, returning early
    if (intervalId.current !== null) {
      return;
    }
    // Timer mode and it reached 0, returning early
    if (elapsedInMs === initialTimeInMs && mode === 'timer') {
      return;
    }
    // First time playing, recording the start time
    if (!startTime.current) {
      startTime.current = Date.now();
    }

    intervalId.current = setInterval(() => {
      if (!pausedTime.current) {
        setElapsedInMs(Date.now() - startTime.current!);
      } else {
        // If the timer is paused, we need to update the start time
        const elapsedSincePaused = Date.now() - pausedTime.current;
        startTime.current = startTime.current! + elapsedSincePaused;
        pausedTime.current = null;
      }
    }, intervalMs);
  }, [elapsedInMs, initialTimeInMs, mode, intervalMs]);

  const resetState = useCallback(() => {
    setElapsedInMs(0);
    startTime.current = null;
    pausedTime.current = null;
  }, []);

  const removeInterval = useCallback(() => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  useEffect(() => {
    // Checking if it's a timer and it reached 0
    if (mode === 'timer' && elapsedInMs >= initialTimeInMs) {
      removeInterval();
      setElapsedInMs(initialTimeInMs);
      throttledOnFinish();
    }
  }, [elapsedInMs, initialTimeInMs, mode, removeInterval, throttledOnFinish]);

  const pause = useCallback(() => {
    removeInterval();
    if (!pausedTime.current && elapsedInMs > 0) {
      pausedTime.current = Date.now();
    }
    return getSnapshot();
  }, [removeInterval, elapsedInMs, getSnapshot]);

  const reset = useCallback(() => {
    removeInterval();
    resetState();
  }, [removeInterval, resetState]);

  // Memoized time calculations to prevent unnecessary re-computations
  const timeValues = useMemo(() => {
    const snapshot = Math.abs(initialTimeInMs + elapsedInMs * direction);
    const countInSeconds = Math.floor(snapshot / 1000);

    return {
      tensOfMs: Math.floor(snapshot / 10) % 100,
      lastDigit: countInSeconds % 10,
      tens: Math.floor(countInSeconds / 10) % 6,
      minutes: needHour
        ? Math.floor((countInSeconds % 3600) / 60)
        : Math.floor(countInSeconds / 60),
      minutestens: needHour
        ? Math.floor((countInSeconds % 3600) / 60)
        : Math.floor(countInSeconds / 60),
      hours: Math.floor(countInSeconds / 3600),
    };
  }, [initialTimeInMs, elapsedInMs, direction, needHour]);

  return {
    ...timeValues,
    play,
    pause,
    reset,
    getSnapshot,
  };
};

export default useTimer;
