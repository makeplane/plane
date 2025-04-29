import { wait } from "@/helpers/delay";
import { logger } from "@/logger";
import { AxiosError } from "axios";

export type APIRatelimitResponse = {
  error_code: number;
  error_message: string;
};

export type APIErrorResponse = {
  id: string;
  error: string;
};

export function AssertAPIRateLimitResponse(error: any): error is APIRatelimitResponse {
  return error.error_code && error.error_message;
}

export function AssertAPIErrorResponse(error: any): error is APIErrorResponse {
  return error.id && error.error;
}

/* Protect Call is an error handling wrapper, that takes care of common errors */
export async function protect<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 60000; // 60 seconds

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn(...args);
    } catch (error) {
      // Check if the error is an API rate limit error
      if (AssertAPIRateLimitResponse(error)) {
        logger.warn(`Rate limit exceeded, waiting for ${RETRY_DELAY / 1000} seconds before retrying...`);
        await wait(RETRY_DELAY);
        continue;
      }

      // Check if the error is an Axios error with status 429
      if (error instanceof AxiosError && error.response?.status === 429) {
        logger.warn(`Rate limit exceeded, waiting for ${RETRY_DELAY / 1000} seconds before retrying...`);
        await wait(RETRY_DELAY);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}

export class APIError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'APIError';
    // Ensures proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}