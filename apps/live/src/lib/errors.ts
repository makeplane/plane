import type { AxiosError } from "axios";

/**
 * Application error class that sanitizes and standardizes errors across the app.
 * Extracts only essential information from AxiosError to prevent massive log bloat
 * and sensitive data leaks (cookies, tokens, etc).
 *
 * Usage:
 *   new AppError("Simple error message")
 *   new AppError("Custom error", { code: "MY_CODE", statusCode: 400 })
 *   new AppError(axiosError)  // Auto-extracts essential info
 *   new AppError(anyError)    // Works with any error type
 */
export class AppError extends Error {
  statusCode?: number;
  method?: string;
  url?: string;
  code?: string;
  context?: Record<string, any>;

  constructor(messageOrError: string | unknown, data?: Partial<Omit<AppError, "name" | "message">>) {
    // Handle error objects - extract essential info
    const error = messageOrError;

    // Already AppError - return immediately for performance (no need to re-process)
    if (error instanceof AppError) {
      return error;
    }

    // Handle string message (simple case like regular Error)
    if (typeof messageOrError === "string") {
      super(messageOrError);
      this.name = "AppError";
      if (data) {
        Object.assign(this, data);
      }
      return;
    }

    // AxiosError - extract ONLY essential info (no config, no headers, no cookies)
    if (error && typeof error === "object" && "isAxiosError" in error) {
      const axiosError = error as AxiosError;
      const responseData = axiosError.response?.data as any;
      super(responseData?.message || axiosError.message);
      this.name = "AppError";
      this.statusCode = axiosError.response?.status;
      this.method = axiosError.config?.method?.toUpperCase();
      this.url = axiosError.config?.url;
      this.code = axiosError.code;
      return;
    }

    // DOMException (AbortError from cancelled requests)
    if (error instanceof DOMException && error.name === "AbortError") {
      super(error.message);
      this.name = "AppError";
      this.code = "ABORT_ERROR";
      return;
    }

    // Standard Error objects
    if (error instanceof Error) {
      super(error.message);
      this.name = "AppError";
      this.code = error.name;
      return;
    }

    // Unknown error types - safe fallback
    super("Unknown error occurred");
    this.name = "AppError";
  }
}
