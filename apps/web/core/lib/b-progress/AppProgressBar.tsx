import { useEffect, useRef } from "react";
import { BProgress } from "@bprogress/core";
import { useNavigation } from "react-router";
import "@bprogress/core/css";

/**
 * Progress bar configuration options
 */
interface ProgressConfig {
  /** Whether to show the loading spinner */
  showSpinner: boolean;
  /** Minimum progress percentage (0-1) */
  minimum: number;
  /** Animation speed in milliseconds */
  speed: number;
  /** Auto-increment speed in milliseconds */
  trickleSpeed: number;
  /** CSS easing function */
  easing: string;
  /** Enable auto-increment */
  trickle: boolean;
  /** Delay before showing progress bar in milliseconds */
  delay: number;
  /** Whether to disable the progress bar */
  isDisabled?: boolean;
}

/**
 * Configuration for the progress bar
 */
const PROGRESS_CONFIG: Readonly<ProgressConfig> = {
  showSpinner: false,
  minimum: 0.1,
  speed: 400,
  trickleSpeed: 800,
  easing: "ease",
  trickle: true,
  delay: 0,
} as const;

/**
 * Navigation Progress Bar Component
 *
 * Automatically displays a progress bar at the top of the page during React Router navigation.
 * Integrates with React Router's useNavigation hook to monitor route changes.
 *
 * Note: Progress bar is disabled in production builds.
 *
 * @returns null - This component doesn't render any visible elements
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <AppProgressBar />
 *       <Outlet />
 *     </>
 *   );
 * }
 * ```
 */
export default function AppProgressBar(): null {
  const navigation = useNavigation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef<boolean>(false);

  // Initialize BProgress once on mount
  useEffect(() => {
    // Skip initialization in production builds
    if (PROGRESS_CONFIG.isDisabled) {
      return;
    }

    // Configure BProgress with our settings
    BProgress.configure({
      showSpinner: PROGRESS_CONFIG.showSpinner,
      minimum: PROGRESS_CONFIG.minimum,
      speed: PROGRESS_CONFIG.speed,
      trickleSpeed: PROGRESS_CONFIG.trickleSpeed,
      easing: PROGRESS_CONFIG.easing,
      trickle: PROGRESS_CONFIG.trickle,
    });

    // Render the progress bar element in the DOM
    BProgress.render(true);

    // Cleanup on unmount
    return () => {
      if (BProgress.isStarted()) {
        BProgress.done();
      }
    };
  }, []);

  // Handle navigation state changes
  useEffect(() => {
    // Skip navigation tracking in production builds
    if (PROGRESS_CONFIG.isDisabled) {
      return;
    }

    if (navigation.state === "idle") {
      // Navigation complete - clear any pending timer
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Complete progress if it was started
      if (startedRef.current) {
        BProgress.done();
        startedRef.current = false;
      }
    } else {
      // Navigation in progress (loading or submitting)
      // Only start if not already started and no timer pending
      if (timerRef.current === null && !startedRef.current) {
        timerRef.current = setTimeout((): void => {
          if (!BProgress.isStarted()) {
            BProgress.start();
            startedRef.current = true;
          }
          timerRef.current = null;
        }, PROGRESS_CONFIG.delay);
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [navigation.state]);

  return null;
}
