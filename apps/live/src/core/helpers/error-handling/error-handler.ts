import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

import { logger } from "@plane/logger";
import { env } from "@/env";
import { manualLogger } from "../logger";
import { handleError } from "./error-factory";
import { ErrorContext, reportError } from "./error-reporting";

/**
 * HTTP Status Codes
 */
export enum HttpStatusCode {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  GONE = 410,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Errors
  INTERNAL_SERVER = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Error categories to classify errors
 */
export enum ErrorCategory {
  OPERATIONAL = "operational", // Expected errors that are part of normal operation (e.g. validation failures)
  PROGRAMMING = "programming", // Unexpected errors that indicate bugs (e.g. null references)
  SYSTEM = "system", // System errors (e.g. out of memory, connection failures)
  FATAL = "fatal", // Severe errors that should crash the app (e.g. unrecoverable state)
}

/**
 * Base Application Error Class
 * All custom errors extend this class
 */
export class AppError extends Error {
  readonly status: number;
  readonly category: ErrorCategory;
  readonly context?: Record<string, any>;
  readonly isOperational: boolean; // Kept for backward compatibility

  constructor(
    message: string,
    status: number = HttpStatusCode.INTERNAL_SERVER,
    category: ErrorCategory = ErrorCategory.PROGRAMMING,
    context?: Record<string, any>
  ) {
    super(message);

    // Set error properties
    this.name = this.constructor.name;
    this.status = status;
    this.category = category;
    this.isOperational = category === ErrorCategory.OPERATIONAL;
    this.context = context;

    // Capture stack trace, excluding the constructor call from the stack
    Error.captureStackTrace(this, this.constructor);

    // Automatically report the error (unless it's being constructed by the error utilities)
    if (!context?.skipReporting) {
      this.report();
    }
  }

  /**
   * Creates a formatted representation of the error
   */
  output() {
    return {
      statusCode: this.status,
      payload: {
        statusCode: this.status,
        error: this.getErrorName(),
        message: this.message,
        category: this.category,
      },
      headers: {},
    };
  }

  /**
   * Gets a descriptive name for the error based on status code
   */
  private getErrorName(): string {
    const statusCodes: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      409: "Conflict",
      410: "Gone",
      422: "Unprocessable Entity",
      429: "Too Many Requests",
      500: "Internal Server Error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
    };

    return statusCodes[this.status] || "Unknown Error";
  }

  /**
   * Reports the error to logging and monitoring systems
   */
  private report(): void {
    // Different logging based on error category
    if (this.category === ErrorCategory.OPERATIONAL) {
      manualLogger.error(
        {
          errorName: this.name,
          errorStatus: this.status,
          errorCategory: this.category,
          context: this.context,
        },
        `Operational error: ${this.message}`
      );
    } else if (this.category === ErrorCategory.FATAL) {
      manualLogger.error(
        {
          errorName: this.name,
          errorStatus: this.status,
          errorCategory: this.category,
          stack: this.stack,
          context: this.context,
        },
        `FATAL error: ${this.message}`
      );
    } else {
      manualLogger.error(
        {
          errorName: this.name,
          errorStatus: this.status,
          errorCategory: this.category,
          stack: this.stack,
          context: this.context,
        },
        `${this.category} error: ${this.message}`
      );
    }
  }
}

export class FatalError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, HttpStatusCode.INTERNAL_SERVER, ErrorCategory.FATAL, context);
  }
}

/**
 * Main Express error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Already sent response, let default Express error handler deal with it
  if (res.headersSent) {
    return next(err);
  }

  // Convert to AppError if it's not already one
  const error = handleError(err, {
    component: "express",
    operation: "error-handler",
    extraContext: {
      originalError: err,
      url: req.originalUrl,
      method: req.method,
    },
  });

  // Normalize status code
  const statusCode = error.status;

  // Set the response status
  res.status(statusCode);

  // Set any custom headers if provided in the error object
  if (err.headers && typeof err.headers === "object") {
    Object.entries(err.headers).forEach(([key, value]) => {
      res.set(key, value as string);
    });
  }

  // Prepare error response
  const errorResponse: {
    error: {
      message: string;
      status: number;
      stack?: string;
    };
  } = {
    error: {
      message:
        error.category === ErrorCategory.OPERATIONAL || env.NODE_ENV !== "production"
          ? error.message
          : "An unexpected error occurred",
      status: statusCode,
    },
  };

  // Add stack trace in non-production environments
  if (env.NODE_ENV !== "production") {
    errorResponse.error.stack = error.stack;
  }

  // Send the response
  res.json(errorResponse);

  // For fatal errors, log but NEVER terminate the app
  if (error.category === ErrorCategory.FATAL) {
    logger.error(`FATAL ERROR OCCURRED BUT APP WILL CONTINUE RUNNING: ${error.message}`);
  }
};

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Convert to AppError if needed and pass to Express error middleware
      const appError = handleError(error, {
        errorType: "internal",
        component: "express",
        operation: "route-handler",
        extraContext: {
          url: req.originalUrl,
          method: req.method,
          body: req.body,
          query: req.query,
          params: req.params,
        },
      });

      next(appError);
    });
  };
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
        // Use handleError to ensure consistent error handling when rethrowing
        handleError(error, {
          component: context?.extra?.component || "unknown",
          operation: context?.extra?.operation || "unknown",
          extraContext: {
            ...context,
            ...(error instanceof AppError ? error.context : {}),
            originalError: error,
          },
          throw: true,
        });
      }

      return defaultValue;
    }
  };
};

/**
 * Set up global error handlers for uncaught exceptions and unhandled rejections
 * @param gracefulTerminationHandler Function to call for graceful termination
 */
export const setupGlobalErrorHandlers = (gracefulTerminationHandler: () => Promise<void>): void => {
  // Handle promise rejections
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error("Unhandled Promise Rejection", { reason });

    // Convert to AppError and handle
    const appError = handleError(reason, {
      errorType: "internal",
      message: reason instanceof Error ? reason.message : String(reason),
      component: "process",
      operation: "unhandledRejection",
      extraContext: { source: "unhandledRejection" },
    });

    // Log the error but never terminate
    logger.error(`Unhandled rejection caught and contained: ${appError.message}`);
  });

  // Handle exceptions
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception", {
      error: error.message,
      stack: error.stack,
    });

    // Convert to AppError if needed
    const appError = handleError(error, {
      errorType: "internal",
      component: "process",
      operation: "uncaughtException",
      extraContext: {
        source: "uncaughtException",
      },
    });

    // Log the error but never terminate
    logger.warn(`Uncaught exception contained: ${appError.message}`);
  });

  // Handle termination signals
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received. Starting graceful termination...");
    gracefulTerminationHandler();
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received. Starting graceful termination...");
    gracefulTerminationHandler();
  });
};

/**
 * Configure error handling middleware for the Express app
 * @param app Express application instance
 */
export function configureErrorHandlers(app: any): void {
  // Global error handling middleware
  app.use(errorHandler);

  // 404 handler must be last
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(
      handleError(null, {
        errorType: "not-found",
        message: "Resource not found",
        component: "express",
        operation: "route-handler",
        extraContext: { path: _req.path },
        throw: true,
      })
    );
  });
}
