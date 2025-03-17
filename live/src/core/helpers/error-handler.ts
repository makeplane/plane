import { ErrorRequestHandler } from "express";
import { manualLogger } from "@/core/helpers/logger";
import { SentryInstance } from "@/sentry-config";
import { env } from "@/env";

// Base custom error class that extends the built-in Error
export class AppError extends Error {
  status: number;
  isOperational: boolean;
  context?: Record<string, any>;

  constructor(message: string, status: number = 500, isOperational: boolean = true, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.isOperational = isOperational;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
    
    // Automatically report the error
    this.report();
  }

  private report() {
    // Log the error
    if (this.isOperational) {
      manualLogger.info(`Operational error: ${this.message}`, { error: this, context: this.context });
    } else {
      manualLogger.error(`Unhandled error: ${this.stack || this.message}`, { error: this, context: this.context });
    }

    // Send to Sentry
    if (SentryInstance) {
      SentryInstance.captureException(this, {
        extra: {
          ...this.context,
          isOperational: this.isOperational,
        },
      });
    }
  }
}

// Operational errors - expected errors that we can recover from
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 404, true, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 401, true, context);
  }
}

// Central error handler
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Already sent response, let default Express error handler deal with it
  if (res.headersSent) {
    return next(err);
  }

  // Determine if this is an operational error or a programming error
  const isOperationalError = err instanceof AppError && err.isOperational;

  // Set the response status
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode);

  // Send the response
  res.json({
    error: {
      message: isOperationalError || env.NODE_ENV !== "production" ? err.message : "An unexpected error occurred",
      status: statusCode,
      ...(env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
};

// Function to handle unhandled rejections and exceptions globally
export const setupGlobalErrorHandlers = (gracefulShutdown: () => Promise<void>) => {
  // Handle promise rejections
  process.on("unhandledRejection", (reason: unknown) => {
    manualLogger.error("Unhandled Rejection: ", reason);
    if (SentryInstance) {
      SentryInstance.captureException(reason);
    }
    manualLogger.error(`UNHANDLED REJECTION! 💥 Shutting down...`);
    gracefulShutdown();
  });

  // Handle exceptions
  process.on("uncaughtException", (error: Error) => {
    manualLogger.error("Uncaught Exception: ", error);
    if (SentryInstance) {
      SentryInstance.captureException(error);
    }
    manualLogger.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
    gracefulShutdown();
  });
};
