// core helpers and utilities
import { RedisManager } from "@/core/lib/redis-manager";
import { shutdownManager } from "../shutdown-manager";
import { CustomHocuspocusRedisExtension } from "./redis";

/**
 * Sets up the Redis extension for HocusPocus using the RedisManager singleton
 * @returns Promise that resolves to a Redis extension array
 */
export const setupRedisExtension = async () => {
  const redisManager = RedisManager.getInstance();

  // Wait for Redis connection
  const redisClient = await redisManager.connect();

  if (redisClient) {
    return new CustomHocuspocusRedisExtension({
      redis: redisClient,
    });
  } else {
    shutdownManager.shutdown("Redis connection failed and could not be recovered", 1);
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
