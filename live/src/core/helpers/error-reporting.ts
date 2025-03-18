import { SentryInstance } from "@/sentry-config";
import { AppError, ErrorCategory } from "./error-handler";
import { logger } from "@plane/logger";
import Errors from "./error-factory";

interface ErrorContext {
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

export interface CatchAsyncOptions<T, E = Error> {
  /** Default value to return in case of error, null by default */
  defaultValue?: T | null;

  /** Whether to report non-AppErrors automatically */
  reportErrors?: boolean;

  /** Whether to rethrow the error after handling it */
  rethrow?: boolean;

  /** Custom error transformer function */
  transformError?: (error: unknown) => E;

  /** Custom error handler function that runs before standard handling */
  onError?: (error: unknown) => void | Promise<void>;

  /** Custom handler for specific error types */
  errorHandlers?: {
    [key: string]: (error: any) => T | null | Promise<T>;
  };
}

export const catchAsync = <T, E = Error>(
  fn: () => Promise<T>,
  context?: ErrorContext,
  options: CatchAsyncOptions<T, E> = {}
): (() => Promise<T | null>) => {
  const { defaultValue = null, onError, rethrow = false } = options;

  return async () => {
    try {
      return await fn();
    } catch (error) {
      // Apply custom error handler if provided
      if (onError) {
        await Promise.resolve(onError(error));
      }

      reportError(error, context);

      if (rethrow) {
        throw error;
      }

      return defaultValue;
    }
  };
};

export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // If it's not an AppError, convert it
      if (!(error instanceof AppError)) {
        error = Errors.convertError(error instanceof Error ? error : new Error(String(error)), {
          context: {
            url: req.originalUrl,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params,
            component: "express",
            operation: "route-handler",
          },
        });
      }

      // Pass to Express error middleware
      next(error);
    });
  };
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
