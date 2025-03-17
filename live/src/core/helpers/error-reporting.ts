import { SentryInstance } from "@/sentry-config";
import { AppError } from "./error-handler";
import { logger } from "@plane/logger";

interface ErrorContext {
  url?: string;
  method?: string;
  body?: any;
  query?: any;
  params?: any;
  extra?: Record<string, any>;
}

/**
 * Utility function to report errors consistently across the application
 * This ensures all errors are properly logged and sent to Sentry
 */
export const reportError = (error: Error | unknown, context?: ErrorContext) => {
  // Log the error
  if (error instanceof AppError) {
    logger.info(`Operational error: ${error.message}`, { error, context });
  } else {
    logger.error(`Unhandled error: ${error instanceof Error ? error.stack || error.message : error}`, {
      error,
      context,
    });
  }

  // Send to Sentry
  if (SentryInstance) {
    console.log("SentryInstance ", error);
    SentryInstance.captureException(error, {
      extra: {
        ...context,
        isOperational: error instanceof AppError,
      },
    });
  }
};

export const catchAsync = async <T>(fn: () => Promise<T>, context?: ErrorContext): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      return null as T;
    }

    // Convert unknown errors to AppError
    throw new AppError(error instanceof Error ? error.message : String(error), 500, false, context);
  }
};

/**
 * Utility function to handle fatal errors that should crash the application
 * This should be used sparingly and only for truly fatal errors
 */
export const handleFatalError = (error: Error | unknown, context?: ErrorContext) => {
  reportError(error, context);
  // This will trigger the global error handler's fatal error handling
  process.emit("uncaughtException", error instanceof Error ? error : new Error(String(error)));
};
