import { SentryInstance } from "@/sentry-config";
import { AppError, ErrorCategory } from "./error-handler";
import { logger } from "@plane/logger";
import Errors from "./error-factory";

export interface ErrorContext {
  url?: string;
  method?: string;
  body?: any;
  query?: any;
  params?: any;
  extra?: Record<string, any>;
}

/**
 * Utility function to report errors that aren't instances of AppError
 * AppError instances automatically report themselves on creation
 * Only use this for external errors that don't use our error system
 */
export const reportError = (error: Error | unknown, context?: ErrorContext): void => {
  if (error instanceof AppError) {
    return;
  }

  logger.error(`External error: ${error instanceof Error ? error.stack || error.message : String(error)}`, {
    error,
    context,
  });

  // Send to Sentry
  if (SentryInstance) {
    SentryInstance.captureException(error, {
      extra: {
        ...context,
        errorCategory: ErrorCategory.PROGRAMMING,
      },
    });
  }
};

export const handleFatalError = (error: Error | unknown, context?: ErrorContext): void => {
  // If it's already a fatal AppError, use it directly
  const fatalError =
    error instanceof AppError && error.category === ErrorCategory.FATAL
      ? error
      : Errors.fatal(error instanceof Error ? error.message : String(error), {
          ...context,
          originalError: error,
        });

  process.emit("uncaughtException", fatalError);
};
