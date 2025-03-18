import { AppError, HttpStatusCode, ErrorCategory } from './error-handler';

// Utility function to convert errors or enhance existing AppErrors
export const convertError = (error: Error, options?: { 
  statusCode?: number;
  message?: string;
  category?: ErrorCategory;
  context?: Record<string, any>;
}): AppError => {
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
        originalError: error
      }
    );
  }
  
  // Convert to AppError
  return new AppError(
    options?.message || error.message,
    options?.statusCode || HttpStatusCode.INTERNAL_SERVER,
    options?.category || ErrorCategory.PROGRAMMING,
    {
      ...(options?.context || {}),
      originalError: error
    }
  );
};

/**
 * Check if an error is an AppError
 */
export const isAppError = (err: any, statusCode?: number): boolean => {
  return err instanceof AppError && (!statusCode || err.status === statusCode);
};

// *** 4xx CLIENT ERRORS *** //

/**
 * 400 Bad Request
 * Invalid request parameters or payload
 */
export const badRequest = (message: string = 'Bad Request', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.BAD_REQUEST, ErrorCategory.OPERATIONAL, context);
};

/**
 * 401 Unauthorized
 * Authentication is required and has failed or not been provided
 */
export const unauthorized = (message: string = 'Unauthorized', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.UNAUTHORIZED, ErrorCategory.OPERATIONAL, context);
};

/**
 * 403 Forbidden
 * Client does not have access rights to the content
 */
export const forbidden = (message: string = 'Forbidden', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.FORBIDDEN, ErrorCategory.OPERATIONAL, context);
};

/**
 * 404 Not Found
 * The requested resource could not be found
 */
export const notFound = (message: string = 'Resource not found', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.NOT_FOUND, ErrorCategory.OPERATIONAL, context);
};

/**
 * 409 Conflict
 * Request conflicts with current state of the server
 */
export const conflict = (message: string = 'Resource conflict', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.CONFLICT, ErrorCategory.OPERATIONAL, context);
};

/**
 * 422 Unprocessable Entity
 * The request was well-formed but unable to be processed due to semantic errors
 */
export const unprocessableEntity = (message: string = 'Unprocessable Entity', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.UNPROCESSABLE_ENTITY, ErrorCategory.OPERATIONAL, context);
};

/**
 * 429 Too Many Requests
 * User has sent too many requests in a given amount of time
 */
export const tooManyRequests = (message: string = 'Too many requests', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.TOO_MANY_REQUESTS, ErrorCategory.OPERATIONAL, context);
};

// *** 5xx SERVER ERRORS *** //

/**
 * 500 Internal Server Error
 * A generic error occurred on the server
 */
export const internal = (message: string = 'Internal Server Error', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.INTERNAL_SERVER, ErrorCategory.PROGRAMMING, context);
};

/**
 * 503 Service Unavailable
 * The server is not ready to handle the request
 */
export const serviceUnavailable = (message: string = 'Service Unavailable', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.SERVICE_UNAVAILABLE, ErrorCategory.SYSTEM, context);
};

/**
 * Fatal Error
 * An error that should cause the application to crash after handling the current request
 */
export const fatal = (message: string = 'Fatal Error', context?: Record<string, any>): AppError => {
  return new AppError(message, HttpStatusCode.INTERNAL_SERVER, ErrorCategory.FATAL, context);
};

// Export all error factory functions
export default {
  convertError,
  isAppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internal,
  serviceUnavailable,
  fatal
};
