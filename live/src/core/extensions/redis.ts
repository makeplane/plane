import { Redis as HocusPocusRedis } from "@hocuspocus/extension-redis";
// core helpers and utilities
import { logger } from "@plane/logger";
import { getRedisClient } from "@/core/lib/redis-manager";

/**
 * Sets up the Redis extension for HocusPocus using the RedisManager singleton
 * @returns Promise that resolves to a Redis extension array
 */
export const setupRedisExtension = () => {
  // Wait for Redis connection
  return new HocusPocusRedis({
    redis: getRedisClient(),
  });
};

