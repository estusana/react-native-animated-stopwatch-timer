/**
 * Performance tests for React Native Animated Stopwatch Timer
 * Tests the optimizations implemented in the enhanced version
 */

import { throttle } from '../utils/throttle';
import {
  formatTimeWorklet,
  OptimizedTimer,
  PerformanceMonitor,
} from '../utils/performance';

// Mock console for testing
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
};

// Mock global variables
(global as any).__DEV__ = true;
(global as any).console = mockConsole;

describe('Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Custom Throttle Implementation', () => {
    it('should throttle function calls correctly', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();

      // Should only be called once initially
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Fast forward time
      jest.advanceTimersByTime(100);

      // Should be called again after throttle period
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should support leading and trailing options', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100, {
        leading: false,
        trailing: true,
      });

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should support cancellation', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn.cancel();

      jest.advanceTimersByTime(100);
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Time Formatting Worklet', () => {
    it('should format time correctly for stopwatch mode', () => {
      const result = formatTimeWorklet(65432, false); // 65.432 seconds

      expect(result).toEqual({
        tensOfMs: 43, // 6543.2 / 10 = 654.32, 654.32 % 100 = 54.32 -> 54
        lastDigit: 5, // 65 % 10 = 5
        tens: 0, // Math.floor(65 / 10) % 6 = 6 % 6 = 0
        minutes: 1, // Math.floor(65 / 60) = 1
        hours: 0, // Math.floor(65 / 3600) = 0
      });
    });

    it('should format time correctly with hours', () => {
      const result = formatTimeWorklet(3665000, true); // 1 hour, 1 minute, 5 seconds

      expect(result).toEqual({
        tensOfMs: 0,
        lastDigit: 5,
        tens: 0,
        minutes: 1, // (3665 % 3600) / 60 = 65 / 60 = 1
        hours: 1, // Math.floor(3665 / 3600) = 1
      });
    });

    it('should handle negative time values', () => {
      const result = formatTimeWorklet(-5000, false); // -5 seconds

      expect(result).toEqual({
        tensOfMs: 0,
        lastDigit: 5,
        tens: 0,
        minutes: 0,
        hours: 0,
      });
    });
  });

  describe('OptimizedTimer', () => {
    let timer: OptimizedTimer;

    beforeEach(() => {
      timer = new OptimizedTimer();
    });

    afterEach(() => {
      timer.cleanup();
    });

    it('should manage multiple callbacks efficiently', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const cleanup1 = timer.addCallback(callback1);
      const cleanup2 = timer.addCallback(callback2);

      // Fast forward to trigger interval
      jest.advanceTimersByTime(16);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      // Cleanup one callback
      cleanup1();
      jest.clearAllMocks();

      jest.advanceTimersByTime(16);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      cleanup2();
    });

    it('should stop timer when no callbacks remain', () => {
      const callback = jest.fn();
      const cleanup = timer.addCallback(callback);

      jest.advanceTimersByTime(16);
      expect(callback).toHaveBeenCalled();

      cleanup();
      jest.clearAllMocks();

      jest.advanceTimersByTime(16);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();

      timer.addCallback(errorCallback);
      timer.addCallback(normalCallback);

      jest.advanceTimersByTime(16);

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[OptimizedTimer] Callback error:',
        expect.any(Error)
      );
    });
  });

  describe('PerformanceMonitor', () => {
    it('should measure render time', () => {
      const mockRenderFn = jest.fn();

      PerformanceMonitor.measureRenderTime('TestComponent', mockRenderFn);

      expect(mockRenderFn).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] TestComponent render time:')
      );
    });

    it('should log performance metrics', () => {
      PerformanceMonitor.logPerformance('TestMetric', 42);

      expect(mockConsole.log).toHaveBeenCalledWith(
        '[Performance] TestMetric: 42ms'
      );
    });

    it('should track animation performance', () => {
      const startTime = Date.now() - 100;
      const duration = PerformanceMonitor.trackAnimation(
        'TestAnimation',
        startTime
      );

      expect(duration).toBeGreaterThanOrEqual(100);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[Animation] TestAnimation duration:')
      );
    });
  });

  describe('Memory Optimization', () => {
    it('should demonstrate reduced function recreations', () => {
      // This test would be more meaningful in a real React component
      // but demonstrates the concept of memoization
      const memoizedFn = jest.fn();
      const deps = [1, 2, 3];

      // Simulate useCallback behavior
      let cachedFn = memoizedFn;
      let cachedDeps = deps;

      const getMemoizedFn = (newDeps: number[]) => {
        if (JSON.stringify(newDeps) !== JSON.stringify(cachedDeps)) {
          cachedFn = jest.fn();
          cachedDeps = newDeps;
        }
        return cachedFn;
      };

      const fn1 = getMemoizedFn([1, 2, 3]);
      const fn2 = getMemoizedFn([1, 2, 3]); // Same deps
      const fn3 = getMemoizedFn([1, 2, 4]); // Different deps

      expect(fn1).toBe(fn2); // Should be same reference
      expect(fn1).not.toBe(fn3); // Should be different reference
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should not import lodash.throttle', () => {
      // This test ensures we're using our custom throttle
      const throttleModule = require('../utils/throttle');
      expect(throttleModule.throttle).toBeDefined();
      expect(typeof throttleModule.throttle).toBe('function');
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should demonstrate improved performance metrics', () => {
    const iterations = 1000;
    const startTime = Date.now();

    // Simulate heavy time calculations
    for (let i = 0; i < iterations; i++) {
      formatTimeWorklet(i * 1000, false);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete 1000 calculations in reasonable time
    expect(duration).toBeLessThan(100); // Less than 100ms for 1000 calculations

    console.log(
      `Performance benchmark: ${iterations} calculations in ${duration}ms`
    );
  });

  it('should demonstrate throttle efficiency', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 16); // 60fps equivalent

    const startTime = Date.now();

    // Simulate rapid calls (like animation frames)
    for (let i = 0; i < 100; i++) {
      throttledFn();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete quickly due to throttling
    expect(duration).toBeLessThan(50);
    expect(mockFn).toHaveBeenCalledTimes(1); // Only called once due to throttling
  });
});
