import { Redis } from "ioredis";
import { Redis as HocusPocusRedis } from "@hocuspocus/extension-redis";
import { Extension } from "@hocuspocus/server";
// core helpers and utilities
import { getRedisUrl } from "@/core/lib/utils/redis-url";
import { logger } from "@plane/logger";
import { handleError } from "@/core/helpers/error-handling/error-factory";
import { AppError, catchAsync } from "@/core/helpers/error-handling/error-handler";

// Keep a reference to the Redis client for cleanup purposes
let redisClient: Redis | null = null;

// Define a custom error type that includes code property
interface RedisError extends Error {
  code?: string;
}

// Circuit breaker to disable Redis after too many failures
let redisCircuitBroken = false;
let redisFailureCount = 0;
const MAX_REDIS_FAILURES = 5;

/**
 * Sets up the Redis extension for HocusPocus with proper error handling
 * @returns Promise that resolves to a Redis extension if successful, or null if Redis is unavailable
 */
export const setupRedisExtension = async (): Promise<Extension | null> => {
  // If circuit breaker is active, don't try to connect to Redis
  if (redisCircuitBroken) {
    logger.warn("Redis circuit breaker active - not attempting to connect");
    return null;
  }

  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    logger.warn(
      "Redis URL is not set, continuing without Redis (you won't be able to sync data between multiple plane live servers)"
    );
    return null;
  }

  return catchAsync(
    async () => {
      // Clean up any existing Redis client first
      if (redisClient) {
        try {
          await cleanupRedisClient(redisClient);
        } catch (err) {
          logger.warn("Error cleaning up previous Redis client", err);
        }
        redisClient = null;
      }

      // Create new Redis client with proper options
      let client: Redis;
      try {
        client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3, // Limit retries to prevent overwhelming logs
          retryStrategy: (times) => {
            // Stop retrying after too many failures or if circuit breaker engaged
            if (times > 10 || redisCircuitBroken) {
              return null; // means stop retrying
            }
            // Backoff strategy with maximum wait time
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
          // Special error handling on connection events
          disconnectTimeout: 5000,
          enableOfflineQueue: false, // Don't queue commands when disconnected
          enableReadyCheck: true,
          // Custom commands error handling
          showFriendlyErrorStack: true,
        });

        setupRedisErrorHandlers(client);

        // Store reference in module-level variable
        redisClient = client;
      } catch (err) {
        logger.error("Failed to create Redis client", err);
        incrementFailureCount();
        return null;
      }

      // Wait for Redis connection or error with a timeout
      const result = await new Promise<Extension | AppError>((resolve) => {
        let hasResolved = false;
        const timeoutId = setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;

            // Example of non-throwing handleError usage
            const error = handleError(new Error("Redis connection timeout"), {
              errorType: "service-unavailable",
              component: "redis-extension",
              operation: "connect",
              message: "Redis connection timeout, continuing without Redis",
            });

            logger.warn(error.message);
            incrementFailureCount();

            // Clean up the client
            cleanupRedisClient(client);
            resolve(error);
          }
        }, 5000);

        client.once("ready", () => {
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeoutId);

            // Reset failure count on successful connection
            redisFailureCount = 0;
            logger.info("Redis client connected successfully ✅");

            try {
              // Create extension with error handling
              const redisExtension = new HocusPocusRedis({
                redis: client,
                prefix: "plane:",
              });

              // Add safe destroy method to the extension
              const extension = redisExtension as unknown as {
                destroy?: () => Promise<void> | void;
                onDestroy?: () => Promise<void> | void;
              };

              // Store the original destroy method
              const originalDestroy = extension.destroy;

              // Replace with our safe version
              extension.destroy = async () => {
                logger.info("Cleaning up Redis extension...");
                try {
                  // Safely clean up the Redis client
                  await cleanupRedisClient(client);
                } catch (err) {
                  logger.warn("Error cleaning up Redis client during destroy", err);
                }

                // Call original destroy method if it exists
                if (originalDestroy) {
                  try {
                    await Promise.resolve(originalDestroy.call(extension));
                  } catch (err) {
                    logger.warn("Error in original destroy method", err);
                  }
                }
              };

              resolve(redisExtension);
            } catch (err) {
              // Handle errors in extension setup
              logger.error("Error creating Redis extension", err);
              cleanupRedisClient(client);
              incrementFailureCount();
              resolve(
                handleError(err as Error, {
                  errorType: "service-unavailable",
                  component: "redis-extension",
                  operation: "create-extension",
                  message: "Failed to create Redis extension",
                })
              );
            }
          }
        });

        client.once("error", (error: RedisError) => {
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeoutId);

            // Increment failure count
            incrementFailureCount();

            // Non-throwing usage with specific error details
            const appError = handleError(error, {
              errorType: "service-unavailable",
              component: "redis-extension",
              operation: "connect",
              message: `Redis client wasn't able to connect, continuing without Redis`,
              extraContext: {
                redisUrl: redisUrl.replace(/\/\/.*:.*@/, "//***:***@"), // Mask credentials
                errorCode: error?.code,
                errorMessage: error?.message,
              },
            });

            logger.warn(appError.message, { errorCode: error?.code });

            // Clean up the client
            cleanupRedisClient(client);
            resolve(appError);
          }
        });
      });

      // If result is an error, return null to indicate Redis is not available
      if (result instanceof AppError) {
        redisClient = null;
        return null;
      }

      return result;
    },
    {
      extra: {
        component: "redis-extension",
        operation: "setup",
        redisUrl: redisUrl.replace(/\/\/.*:.*@/, "//***:***@"), // Mask credentials for logging
      },
    },
    {
      defaultValue: null, // Return null if any error occurs
      rethrow: false, // Never rethrow, always gracefully continue without Redis
    }
  )().catch((err) => {
    // Extra safety net - catch any errors the catchAsync might miss
    logger.error("Uncaught error in Redis setup", err);
    return null;
  });
};

/**
 * Handle multiple failures with circuit breaker pattern
 */
function incrementFailureCount(): void {
  redisFailureCount++;

  if (redisFailureCount >= MAX_REDIS_FAILURES) {
    logger.error(`Redis failures reached threshold (${MAX_REDIS_FAILURES}), activating circuit breaker`);
    redisCircuitBroken = true;

    // Cleanup any existing client
    if (redisClient) {
      cleanupRedisClient(redisClient).catch((err) =>
        logger.error("Error cleaning up Redis client during circuit break", err)
      );
      redisClient = null;
    }

    // Set a timeout to reset the circuit breaker
    setTimeout(() => {
      logger.info("Redis circuit breaker reset, will try connecting again on next request");
      redisCircuitBroken = false;
      redisFailureCount = 0;
    }, 60000); // Try again after 1 minute
  }
}

/**
 * Set up global error handlers for the Redis client
 * This prevents unhandled errors from crashing the application
 */
function setupRedisErrorHandlers(client: Redis) {
  // Capture ALL error events
  client.on("error", (err: RedisError) => {
    // Only increment failures for certain types of errors
    if (
      err.message?.includes("ECONNREFUSED") ||
      err.message?.includes("ETIMEDOUT") ||
      err.message?.includes("EPIPE") ||
      err.message?.includes("MaxRetriesPerRequestError") ||
      err.code === "ECONNREFUSED"
    ) {
      incrementFailureCount();
    }

    // Log the error but don't crash
    handleError(err, {
      errorType: "service-unavailable",
      component: "redis-extension",
      operation: "ongoing-connection",
      message: `Redis error occurred (will attempt to recover)`,
      extraContext: {
        errorCode: err?.code,
        errorMessage: err?.message,
      },
    });

    // Log at warn level so we don't flood logs with errors
    logger.warn(`Redis error: ${err.message}`, {
      errorCode: err?.code,
      stack: err?.stack,
    });
  });

  // Handle specific reconnection errors that might indicate Redis is down
  client.on("reconnecting", (time: number) => {
    logger.info(`Redis reconnecting after ${time}ms...`);
  });

  // Handle MaxRetriesPerRequestError specifically
  process.on("unhandledRejection", (reason: unknown) => {
    // Only handle Redis-related errors
    if (
      reason instanceof Error &&
      (reason.message.includes("MaxRetriesPerRequestError") || reason.message.includes("Redis"))
    ) {
      logger.warn("Caught unhandled Redis-related rejection", {
        message: reason.message,
        stack: reason.stack,
      });

      incrementFailureCount();

      // Don't let it crash the process
      return;
    }
    // Let other unhandled rejections pass through to the default handler
  });

  // Handle connection end events
  client.on("end", () => {
    logger.warn("Redis connection ended");
    // This is normal during shutdown, don't increment failure count
  });
}

/**
 * Safely clean up a Redis client connection
 */
async function cleanupRedisClient(client: Redis | null): Promise<void> {
  if (!client) return;

  try {
    // Remove all listeners to prevent memory leaks
    client.removeAllListeners();

    // Quit the connection gracefully
    if (client.status !== "end") {
      await Promise.race([
        client.quit().catch(() => {
          // If quit fails, force disconnect
          client.disconnect();
        }),
        // Safety timeout in case quit hangs
        new Promise<void>((resolve) =>
          setTimeout(() => {
            client.disconnect();
            resolve();
          }, 1000)
        ),
      ]);
    }
  } catch (err) {
    // Just force disconnect if anything goes wrong
    try {
      client.disconnect();
    } catch (disconnectErr) {
      // At this point, we've tried our best
      logger.error("Failed to properly disconnect Redis client", disconnectErr);
    }
  }
}

/**
 * Helper to get the current Redis status
 * Useful for health checks
 */
export const getRedisStatus = (): "connected" | "connecting" | "disconnected" | "circuit-broken" | "not-configured" => {
  if (redisCircuitBroken) return "circuit-broken";
  if (!redisClient) return "not-configured";

  switch (redisClient.status) {
    case "ready":
      return "connected";
    case "connect":
    case "reconnecting":
      return "connecting";
    default:
      return "disconnected";
  }
};
