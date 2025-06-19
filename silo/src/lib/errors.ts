import { AxiosError, RawAxiosResponseHeaders } from "axios";
import { wait } from "@/helpers/delay";
import { logger } from "@/logger";

export type APIRatelimitResponse = {
  error_code: number;
  error_message: string;
};

export type APIErrorResponse = {
  id: string;
  error: string;
};

export function AssertAPIRateLimitResponse(error: any): error is APIRatelimitResponse {
  return error?.error_code && error?.error_message;
}

export function AssertAPIErrorResponse(error: any): error is APIErrorResponse {
  return error?.id && error?.error;
}

interface RateLimitHeaders {
  "x-ratelimit-limit": string;
  "x-ratelimit-remaining": string;
  "x-ratelimit-reset": string;
}

interface APIRateLimitError extends Error {
  response?: {
    headers?: Partial<RateLimitHeaders>;
  };
}

function isRateLimitHeaders(headers: any): headers is RateLimitHeaders {
  return (
    headers && "x-ratelimit-limit" in headers && "x-ratelimit-remaining" in headers && "x-ratelimit-reset" in headers
  );
}

function getWaitTime(resetTimestamp: string): number {
  const resetTime = parseInt(resetTimestamp, 10) * 1000; // Convert to milliseconds
  const now = Date.now();
  const waitTime = resetTime - now;
  return Math.max(waitTime, 0); // Ensure we don't return negative wait times
}

/**
 * Protect Call is an error handling wrapper that uses rate limit headers for intelligent retry logic.
 * It will retry the function if the error is an API rate limit error.
 * It will use exponential backoff with jitter to avoid overwhelming the server.
 * It will wait until the rate limit is reset before retrying.
 * It will throw an error if the max retries are exceeded.
 * DON'T use this if inside the function you are looping over results to make multiple API calls. else it'll restart the loop after again.
 * @param fn - The function to protect
 * @param args - The arguments to pass to the function
 * @returns The result of the function
 */
export async function protect<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
  const MAX_RETRIES = 5;
  const MIN_RETRY_DELAY = 1000; // Minimum 1 second delay
  const MAX_RETRY_DELAY = 60000; // Maximum 60 second delay

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn(...args);
    } catch (error) {
      // Check if the error is an Axios error with status 429
      if (error instanceof AxiosError && error.response?.status === 429) {
        logger.info("Rate limit exceeded ====== in protect");
        const headers = error.response.headers as RawAxiosResponseHeaders;
        if (isRateLimitHeaders(headers)) {
          const waitTime = getWaitTime(headers["x-ratelimit-reset"]);
          logger.info(`Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds until reset...`);
          await wait(waitTime);
          continue;
        }
        // If we don't have rate limit headers, use exponential backoff
        const backoffTime = Math.min(MIN_RETRY_DELAY * Math.pow(2, attempt) + Math.random() * 1000, MAX_RETRY_DELAY);
        logger.info(`Rate limit exceeded (429). Retrying in ${Math.ceil(backoffTime / 1000)} seconds...`);
        await wait(backoffTime);
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
    this.name = "APIError";
    // Ensures proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}
