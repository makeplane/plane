import { Redis } from "ioredis";
import { logger } from "@plane/logger";

let redisClient: Redis | null = null;

export async function initializeRedis(): Promise<Redis> {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    logger.error("Redis URL is not configured. Please set REDIS_URL environment variable.");
    process.exit(1);
  }

  try {
    redisClient = new Redis(redisUrl);
    
    redisClient.on("error", (error) => {
      logger.error("Redis connection error:", error);
      process.exit(1);
    });

    // Wait for the connection to be ready
    await new Promise<void>((resolve, reject) => {
      redisClient!.on("ready", () => {
        logger.info("Redis connection established successfully");
        resolve();
      });

      redisClient!.on("error", (error) => {
        reject(error);
      });
    });

    return redisClient;
  } catch (error) {
    logger.error("Failed to initialize Redis:", error);
    process.exit(1);
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call initializeRedis() first.");
  }
  return redisClient;
}

function getRedisUrl() {
  const redisUrl = process.env.REDIS_URL?.trim();
  const redisHost = process.env.REDIS_HOST?.trim();
  const redisPort = process.env.REDIS_PORT?.trim();

  if (redisUrl) {
    return redisUrl;
  }

  if (redisHost && redisPort && !Number.isNaN(Number(redisPort))) {
    return `redis://${redisHost}:${redisPort}`;
  }

  return "";
}