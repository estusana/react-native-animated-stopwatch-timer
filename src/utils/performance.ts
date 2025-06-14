/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Performance utilities for React Native Animated Stopwatch Timer
 * Optimized functions for better performance and memory usage
 */

// Declare global functions for React Native environment
declare const setInterval: (callback: () => void, delay: number) => number;
declare const clearInterval: (id: number) => void;
declare const __DEV__: boolean;
declare const console: {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

/**
 * Worklet function to format time on UI thread
 * Reduces JavaScript bridge calls and improves performance
 */
export const formatTimeWorklet = (timeInMs: number, needHour: boolean) => {
  'worklet';

  const countInSeconds = Math.floor(Math.abs(timeInMs) / 1000);

  return {
    tensOfMs: Math.floor(Math.abs(timeInMs) / 10) % 100,
    lastDigit: countInSeconds % 10,
    tens: Math.floor(countInSeconds / 10) % 6,
    minutes: needHour
      ? Math.floor((countInSeconds % 3600) / 60)
      : Math.floor(countInSeconds / 60),
    hours: Math.floor(countInSeconds / 3600),
  };
};

/**
 * Performance monitoring utilities for React Native
 */
export const PerformanceMonitor = {
  /**
   * Measure component render time using Date.now()
   */
  measureRenderTime: (componentName: string, renderFn: () => void) => {
    const startTime = Date.now();
    renderFn();
    const endTime = Date.now();

    if (__DEV__) {
      console.log(
        `[Performance] ${componentName} render time: ${endTime - startTime}ms`
      );
    }
  },

  /**
   * Simple performance logging for React Native
   */
  logPerformance: (label: string, value: number) => {
    if (__DEV__) {
      console.log(`[Performance] ${label}: ${value}ms`);
    }
  },

  /**
   * Track animation performance
   */
  trackAnimation: (animationName: string, startTime: number) => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (__DEV__) {
      console.log(`[Animation] ${animationName} duration: ${duration}ms`);
    }

    return duration;
  },
};

/**
 * Optimized timer interval management
 */
export class OptimizedTimer {
  private intervalId: number | null = null;
  private callbacks: Set<() => void> = new Set();
  private isRunning = false;

  /**
   * Add a callback to the timer
   */
  addCallback(callback: () => void): () => void {
    this.callbacks.add(callback);

    if (!this.isRunning) {
      this.start();
    }

    // Return cleanup function
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.stop();
      }
    };
  }

  /**
   * Start the optimized timer
   */
  private start(intervalMs: number = 16): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      // Execute all callbacks in a single interval
      this.callbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          if (__DEV__) {
            console.error('[OptimizedTimer] Callback error:', error);
          }
        }
      });
    }, intervalMs);
  }

  /**
   * Stop the timer
   */
  private stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Cleanup all callbacks and stop timer
   */
  cleanup(): void {
    this.callbacks.clear();
    this.stop();
  }
}

// Global optimized timer instance
export const globalTimer = new OptimizedTimer();

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = Date.now();

  return {
    measureRender: () => {
      const endTime = Date.now();
      if (__DEV__) {
        console.log(
          `[Performance] ${componentName} render: ${endTime - startTime}ms`
        );
      }
    },
    logPerformance: (label: string, value: number) =>
      PerformanceMonitor.logPerformance(`${componentName} - ${label}`, value),
  };
};
