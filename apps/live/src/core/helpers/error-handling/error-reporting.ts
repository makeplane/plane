import { logger } from "@plane/logger";
import { handleError } from "./error-factory";
import { AppError } from "./error-handler";

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
    // if it's an app error, don't report it as it's already been reported
    return;
  }

  logger.error(`External error: ${error instanceof Error ? error.stack || error.message : String(error)}`, {
    error,
    context,
  });
};

export const handleFatalError = (error: Error | unknown, context?: ErrorContext): void => {
  // Convert to fatal AppError
  const fatalError = handleError(error, {
    errorType: "fatal",
    message: error instanceof Error ? error.message : String(error),
    component: context?.extra?.component || "system",
    operation: context?.extra?.operation || "fatal-error-handler",
    extraContext: {
      ...context,
      originalError: error,
    },
  });

  process.emit("uncaughtException", fatalError);
};
