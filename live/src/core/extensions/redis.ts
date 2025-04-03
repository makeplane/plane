import { Redis as HocusPocusRedis } from "@hocuspocus/extension-redis";
// core helpers and utilities
import { logger } from "@plane/logger";
import { RedisManager } from "@/core/lib/redis-manager";

/**
 * Sets up the Redis extension for HocusPocus using the RedisManager singleton
 * @returns Promise that resolves to a Redis extension array
 */
export const setupRedisExtension = async () => {
  const redisManager = RedisManager.getInstance();

  // Wait for Redis connection
  const redisClient = await redisManager.connect();

  if (redisClient) {
    return new HocusPocusRedis({
      redis: redisClient,
    });
  } else {
    logger.warn(
      "Redis connection failed, continuing without Redis extension (you won't be able to sync data between multiple plane live servers)"
    );
  }
};

/**
 * Helper to get the current Redis status
 * Useful for health checks
 */
export const getRedisStatus = (): "connected" | "connecting" | "disconnected" | "not-configured" => {
  const redisManager = RedisManager.getInstance();
  return redisManager.getStatus();
};
