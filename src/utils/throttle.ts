/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lightweight throttle implementation to replace lodash.throttle
 * Reduces bundle size by ~2KB while maintaining the same functionality
 * Optimized for React Native environment
 */

// Declare global timer functions for React Native
declare const setTimeout: (callback: () => void, delay: number) => number;
declare const clearTimeout: (id: number) => void;

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void } {
  let timeout: number | null = null;
  let previous = 0;
  let result: ReturnType<T>;

  const { leading = true, trailing = true } = options;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (!previous && !leading) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(this, args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = !leading ? 0 : Date.now();
        timeout = null;
        result = func.apply(this, args);
      }, remaining);
    }

    return result;
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    previous = 0;
  };

  return throttled;
}
