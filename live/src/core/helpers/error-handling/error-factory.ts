import { AppError, HttpStatusCode, ErrorCategory } from "./error-handler";

/**
 * Map of error types to their corresponding factory functions
 * This ensures that error types and their implementations stay in sync
 */
interface ErrorFactory {
  statusCode: number;
  category: ErrorCategory;
  defaultMessage: string;
  createError: (message?: string, context?: Record<string, any>) => AppError;
}

const ERROR_FACTORIES = {
  "bad-request": {
    statusCode: HttpStatusCode.BAD_REQUEST,
    category: ErrorCategory.OPERATIONAL,
    defaultMessage: "Bad Request",
    createError: (message = "Bad Request", context?) =>
      new AppError(message, HttpStatusCode.BAD_REQUEST, ErrorCategory.OPERATIONAL, context),
  },
  unauthorized: {
    statusCode: HttpStatusCode.UNAUTHORIZED,
    category: ErrorCategory.OPERATIONAL,
    defaultMessage: "Unauthorized",
    createError: (message = "Unauthorized", context?) =>
      new AppError(message, HttpStatusCode.UNAUTHORIZED, ErrorCategory.OPERATIONAL, context),
  },
  forbidden: {
    statusCode: HttpStatusCode.FORBIDDEN,
    category: ErrorCategory.OPERATIONAL,
    defaultMessage: "Forbidden",
    createError: (message = "Forbidden", context?) =>
      new AppError(message, HttpStatusCode.FORBIDDEN, ErrorCategory.OPERATIONAL, context),
  },
  "not-found": {
    statusCode: HttpStatusCode.NOT_FOUND,
    category: ErrorCategory.OPERATIONAL,
    defaultMessage: "Resource not found",
    createError: (message = "Resource not found", context?) =>
      new AppError(message, HttpStatusCode.NOT_FOUND, ErrorCategory.OPERATIONAL, context),
  },
  conflict: {
    statusCode: HttpStatusCode.CONFLICT,
    category: ErrorCategory.OPERATIONAL,
    defaultMessage: "Resource conflict",
    createError: (message = "Resource conflict", context?) =>
      new AppError(message, HttpStatusCode.CONFLICT, ErrorCategory.OPERATIONAL, context),
  },
  "unprocessable-entity": {
    statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
    category: ErrorCategory.OPERATIONAL,
    defaultMessage: "Unprocessable Entity",
    createError: (message = "Unprocessable Entity", context?) =>
      new AppError(message, HttpStatusCode.UNPROCESSABLE_ENTITY, ErrorCategory.OPERATIONAL, context),
  },
  "too-many-requests": {
    statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
    category: ErrorCategory.OPERATIONAL,
    defaultMessage: "Too many requests",
    createError: (message = "Too many requests", context?) =>
      new AppError(message, HttpStatusCode.TOO_MANY_REQUESTS, ErrorCategory.OPERATIONAL, context),
  },
  internal: {
    statusCode: HttpStatusCode.INTERNAL_SERVER,
    category: ErrorCategory.PROGRAMMING,
    defaultMessage: "Internal Server Error",
    createError: (message = "Internal Server Error", context?) =>
      new AppError(message, HttpStatusCode.INTERNAL_SERVER, ErrorCategory.PROGRAMMING, context),
  },
  "service-unavailable": {
    statusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
    category: ErrorCategory.SYSTEM,
    defaultMessage: "Service Unavailable",
    createError: (message = "Service Unavailable", context?) =>
      new AppError(message, HttpStatusCode.SERVICE_UNAVAILABLE, ErrorCategory.SYSTEM, context),
  },
  fatal: {
    statusCode: HttpStatusCode.INTERNAL_SERVER,
    category: ErrorCategory.FATAL,
    defaultMessage: "Fatal Error",
    createError: (message = "Fatal Error", context?) =>
      new AppError(message, HttpStatusCode.INTERNAL_SERVER, ErrorCategory.FATAL, context),
  },
} satisfies Record<string, ErrorFactory>;

// Create the type from the keys of the error factories map
export type ErrorType = keyof typeof ERROR_FACTORIES;

// -------------------------------------------------------------------------
// Primary public API - Recommended for most use cases
// -------------------------------------------------------------------------

/**
 * Base options for handleError function
 */
type BaseErrorHandlerOptions = {
  // Error classification options
  errorType?: ErrorType;
  message?: string;

  // Context information
  component: string;
  operation: string;
  extraContext?: Record<string, any>;

  // Behavior options
  rethrowIfAppError?: boolean;
};

/**
 * Options for throwing variant of handleError - discriminated by throw: true
 */
export type ThrowingOptions = BaseErrorHandlerOptions & {
  throw: true;
};

/**
 * Options for non-throwing variant of handleError - default behavior
 */
export type NonThrowingOptions = BaseErrorHandlerOptions;

/**
 * Unified error handler that encapsulates common error handling patterns
 *
 * @param error The error to handle
 * @param options Configuration options with throw: true to throw the error instead of returning it
 * @returns Never returns - always throws
 * @example
 * // Throwing version
 * handleError(error, {
 *   errorType: 'not-found',
 *   component: 'user-service',
 *   operation: 'getUserById',
 *   throw: true
 * });
 */
export function handleError(error: unknown, options: ThrowingOptions): never;

/**
 * Unified error handler that encapsulates common error handling patterns
 *
 * @param error The error to handle
 * @param options Configuration options (non-throwing by default)
 * @returns The AppError instance
 * @example
 * // Non-throwing version (default)
 * const appError = handleError(error, {
 *   errorType: 'not-found',
 *   component: 'user-service',
 *   operation: 'getUserById'
 * });
 * return { error: appError.output() };
 */
export function handleError(error: unknown, options: NonThrowingOptions): AppError;

/**
 * Implementation of handleError that handles both throwing and non-throwing cases
 */
export function handleError(error: unknown, options: ThrowingOptions | NonThrowingOptions): AppError | never {
  // Only throw if throw is explicitly true
  const shouldThrow = (options as ThrowingOptions).throw === true;

  // If the error is already an AppError and we want to rethrow it as is
  if (options.rethrowIfAppError !== false && error instanceof AppError) {
    if (shouldThrow) {
      throw error;
    }
    return error;
  }

  // Format the error message
  const errorMessage = options.message
    ? error instanceof Error
      ? `${options.message}: ${error.message}`
      : error
        ? `${options.message}: ${String(error)}`
        : options.message
    : error instanceof Error
      ? error.message
      : error
        ? String(error)
        : "Unknown error occurred";

  // Build context object
  const context = {
    component: options.component,
    operation: options.operation,
    originalError: error,
    ...(options.extraContext || {}),
  };

  // Create the appropriate error type using our factory map
  const errorType = options.errorType || "internal";
  const factory = ERROR_FACTORIES[errorType];

  if (!factory) {
    // If no factory found, default to internal error
    return ERROR_FACTORIES.internal.createError(errorMessage, context);
  }

  // Create the error with the factory
  const appError = factory.createError(errorMessage, context);

  // If we should throw, do so now
  if (shouldThrow) {
    throw appError;
  }

  return appError;
}

/**
 * Utility function to convert errors or enhance existing AppErrors
 */
export const convertError = (
  error: Error,
  options?: {
    statusCode?: number;
    message?: string;
    category?: ErrorCategory;
    context?: Record<string, any>;
  }
): AppError => {
  if (error instanceof AppError) {
    // If it's already an AppError and no overrides, return as is
    if (!options?.statusCode && !options?.message && !options?.category) {
      return error;
    }

    // Create a new AppError with the original as context
    return new AppError(
      options?.message || error.message,
      options?.statusCode || error.status,
      options?.category || error.category,
      {
        ...(error.context || {}),
        ...(options?.context || {}),
        originalError: error,
      }
    );
  }

  // Determine the appropriate error type based on status code
  let errorType: ErrorType = "internal";
  if (options?.statusCode) {
    // Find the error type that matches the status code
    const entry = Object.entries(ERROR_FACTORIES).find(([_, factory]) => factory.statusCode === options.statusCode);
    if (entry) {
      errorType = entry[0] as ErrorType;
    }
  }

  // Return a new AppError using the factory
  return handleError(error, {
    errorType: errorType,
    message: options?.message,
    component: options?.context?.component || "unknown",
    operation: options?.context?.operation || "convert-error",
    extraContext: options?.context,
  });
};

/**
 * Check if an error is an AppError
 */
export const isAppError = (err: any, statusCode?: number): boolean => {
  return err instanceof AppError && (!statusCode || err.status === statusCode);
};

// Export only the public API
export default {
  handleError,
  convertError,
  isAppError,
};
