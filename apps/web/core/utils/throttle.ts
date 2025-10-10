/**
 * Performance throttling utility for keyboard events
 */

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Create a throttled keyboard event handler
 */
export function createThrottledKeyboardHandler(
  handler: (event: KeyboardEvent) => void,
  throttleMs: number = 100
): (event: KeyboardEvent) => void {
  return throttle(handler, throttleMs);
}
