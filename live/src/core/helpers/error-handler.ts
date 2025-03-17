import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

import { SentryInstance, captureException } from "@/sentry-config";
import { env } from "@/env";
import { logger } from "@plane/logger";

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
      logger.info(`Operational error: ${this.message}`, { error: this, context: this.context });
    } else {
      logger.error(`Unhandled error: ${this.stack || this.message}`, { error: this, context: this.context });
    }

    // Send to Sentry
    if (SentryInstance) {
      captureException(this, {
        extra: {
          ...this.context,
          isOperational: this.isOperational,
        },
      });
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 404, true, context);
  }
}

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
    logger.error("Unhandled Rejection: ", reason);
    if (SentryInstance) {
      SentryInstance.captureException(reason);
    }
    logger.error(`UNHANDLED REJECTION! 💥 Shutting down...`);
    gracefulShutdown();
  });

  // Handle exceptions
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception: ", error);
    if (SentryInstance) {
      SentryInstance.captureException(error);
    }
    logger.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
    gracefulShutdown();
  });
};

/**
 * Configure error handling middleware for the Express app
 */
export function configureErrorHandlers(app: any): void {
  // Global error handling middleware
  app.use(errorHandler);

  // 404 handler must be last
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError("Resource not found"));
  });
}
