import StopwatchTimer from './StopwatchTimer';
import type {
  StopwatchTimerProps,
  StopwatchTimerMethods,
} from './StopwatchTimer';

// Export main component
export default StopwatchTimer;
export type { StopwatchTimerProps, StopwatchTimerMethods };

// Export performance utilities for advanced usage
export { throttle } from './utils/throttle';
export {
  formatTimeWorklet,
  PerformanceMonitor,
  OptimizedTimer,
  globalTimer,
  usePerformanceMonitor,
} from './utils/performance';

// Export timer hook for custom implementations
export { default as useTimer } from './useTimer';
