import { logger } from "@plane/logger";

/**
 * DebounceState - Tracks the state of a debounced function
 */
export interface DebounceState {
  lastArgs: any[] | null;
  timerId: ReturnType<typeof setTimeout> | null;
  lastCallTime: number | undefined;
  lastExecutionTime: number;
  inProgress: boolean;
  abortController: AbortController | null;
}

/**
 * Creates a new DebounceState object
 */
export const createDebounceState = (): DebounceState => ({
  lastArgs: null,
  timerId: null,
  lastCallTime: undefined,
  lastExecutionTime: 0,
  inProgress: false,
  abortController: null,
});

/**
 * DebounceOptions - Configuration options for debounce
 */
export interface DebounceOptions {
  /** The wait time in milliseconds */
  wait: number;

  /** Optional logging prefix for debug messages */
  logPrefix?: string;
}

/**
 * Enhanced debounce manager with abort support
 * Manages the state and timing of debounced function calls
 */
export class DebounceManager {
  private state: DebounceState;
  private wait: number;
  private logPrefix: string;

  /**
   * Creates a new DebounceManager
   * @param options Debounce configuration options
   */
  constructor(options: DebounceOptions) {
    this.state = createDebounceState();
    this.wait = options.wait;
    this.logPrefix = options.logPrefix || "";
  }

  /**
   * Schedule a debounced function call
   * @param func The function to call
   * @param args The arguments to pass to the function
   */
  schedule(func: (...args: any[]) => Promise<void>, ...args: any[]): void {
    // Always update the last arguments
    this.state.lastArgs = args;

    const time = Date.now();
    this.state.lastCallTime = time;

    // If an operation is in progress, just store the new args and start the timer
    if (this.state.inProgress) {
      // Always restart the timer for the new call, even if an operation is in progress
      if (this.state.timerId) {
        clearTimeout(this.state.timerId);
      }

      this.state.timerId = setTimeout(() => {
        this.timerExpired(func);
      }, this.wait);
      return;
    }

    // If already scheduled, update the args and restart the timer
    if (this.state.timerId) {
      clearTimeout(this.state.timerId);
      this.state.timerId = setTimeout(() => {
        this.timerExpired(func);
      }, this.wait);
      return;
    }

    // Start the timer for the trailing edge execution
    this.state.timerId = setTimeout(() => {
      this.timerExpired(func);
    }, this.wait);
  }

  /**
   * Called when the timer expires
   */
  private timerExpired(func: (...args: any[]) => Promise<void>): void {
    const time = Date.now();

    // Check if this timer expiration represents the end of the debounce period
    if (this.shouldInvoke(time)) {
      // Execute the function
      this.executeFunction(func, time);
      return;
    }

    // Otherwise restart the timer
    this.state.timerId = setTimeout(() => {
      this.timerExpired(func);
    }, this.remainingWait(time));
  }

  /**
   * Execute the debounced function
   */
  private executeFunction(func: (...args: any[]) => Promise<void>, time: number): void {
    this.state.timerId = null;
    this.state.lastExecutionTime = time;

    // Execute the function asynchronously
    this.performFunction(func).catch((error) => {
      logger.error(`${this.logPrefix}: Error in execution:`, error);
    });
  }

  /**
   * Perform the actual function call, handling any in-progress operations
   */
  private async performFunction(func: (...args: any[]) => Promise<void>): Promise<void> {
    const args = this.state.lastArgs;
    if (!args) return;

    // Store the args we're about to use
    const currentArgs = [...args];

    // If another operation is in progress, abort it
    await this.abortOngoingOperation();

    // Mark that we're starting a new operation
    this.state.inProgress = true;
    this.state.abortController = new AbortController();

    try {
      // Add the abort signal to the arguments if the function can use it
      const execArgs = [...currentArgs];
      execArgs.push(this.state.abortController.signal);

      await func(...execArgs);

      // Only clear lastArgs if they haven't been changed during this operation
      if (this.state.lastArgs && this.arraysEqual(this.state.lastArgs, currentArgs)) {
        this.state.lastArgs = null;

        // Clear any timer as we've successfully processed the latest args
        if (this.state.timerId) {
          clearTimeout(this.state.timerId);
          this.state.timerId = null;
        }
      } else if (this.state.lastArgs) {
        // If lastArgs have changed during this operation, the timer should already be running
        // but let's make sure it is
        if (!this.state.timerId) {
          this.state.timerId = setTimeout(() => {
            this.timerExpired(func);
          }, this.wait);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Nothing to do here, the new operation will be triggered by the timer expiration
      } else {
        logger.error(`${this.logPrefix}: Error during operation:`, error);

        // On error (not abort), make sure we have a timer running to retry
        if (!this.state.timerId && this.state.lastArgs) {
          this.state.timerId = setTimeout(() => {
            this.timerExpired(func);
          }, this.wait);
        }
      }
    } finally {
      this.state.inProgress = false;
      this.state.abortController = null;
    }
  }

  /**
   * Abort any ongoing operation
   */
  private async abortOngoingOperation(): Promise<void> {
    if (this.state.inProgress && this.state.abortController) {
      this.state.abortController.abort();

      // Small delay to ensure the abort has had time to propagate
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Double-check that state has been reset, force it if not
      if (this.state.inProgress || this.state.abortController) {
        this.state.inProgress = false;
        this.state.abortController = null;
      }
    }
  }

  /**
   * Determine if we should invoke the function now
   */
  private shouldInvoke(time: number): boolean {
    // Either this is the first call, or we've waited long enough since the last call
    return this.state.lastCallTime === undefined || time - this.state.lastCallTime >= this.wait;
  }

  /**
   * Calculate how much longer we should wait
   */
  private remainingWait(time: number): number {
    const timeSinceLastCall = time - (this.state.lastCallTime || 0);
    return Math.max(0, this.wait - timeSinceLastCall);
  }

  /**
   * Force immediate execution
   */
  async flush(func: (...args: any[]) => Promise<void>): Promise<void> {
    // Clear any pending timeout
    if (this.state.timerId) {
      clearTimeout(this.state.timerId);
      this.state.timerId = null;
    }

    // Reset timing state
    this.state.lastCallTime = undefined;

    // Perform the function immediately
    if (this.state.lastArgs) {
      await this.performFunction(func);
    }
  }

  /**
   * Cancel any pending operations without executing
   */
  cancel(): void {
    // Clear any pending timeout
    if (this.state.timerId) {
      clearTimeout(this.state.timerId);
      this.state.timerId = null;
    }

    // Reset timing state
    this.state.lastCallTime = undefined;

    // Abort any in-progress operation
    if (this.state.inProgress && this.state.abortController) {
      this.state.abortController.abort();
      this.state.inProgress = false;
      this.state.abortController = null;
    }

    // Clear args
    this.state.lastArgs = null;
  }

  /**
   * Compare two arrays for equality
   */
  private arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
