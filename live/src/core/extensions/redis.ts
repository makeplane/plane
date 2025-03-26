import { Redis as HocusPocusRedis } from "@hocuspocus/extension-redis";
import { Extension } from "@hocuspocus/server";
// core helpers and utilities
import { logger } from "@plane/logger";
import { RedisManager } from "@/core/lib/redis-manager";

/**
 * Sets up the Redis extension for HocusPocus using the RedisManager singleton
 * @returns Promise that resolves to a Redis extension array
 */
export const setupRedisExtension = async (): Promise<Extension[]> => {
  const extensions: Extension[] = [];
  const redisManager = RedisManager.getInstance();

  // Wait for Redis connection
  const redisClient = await redisManager.connect();

  if (redisClient) {
    extensions.push(
      new HocusPocusRedis({
        redis: redisClient,
      })
    );
    logger.info("HocusPocus Redis extension configured ✅");
  } else {
    logger.warn(
      "Redis connection failed, continuing without Redis extension (you won't be able to sync data between multiple plane live servers)"
    );
  }

  return extensions;
};

/**
 * Helper to get the current Redis status
 * Useful for health checks
 */
export const getRedisStatus = (): "connected" | "connecting" | "disconnected" | "not-configured" => {
  const redisManager = RedisManager.getInstance();
  return redisManager.getStatus();
};
