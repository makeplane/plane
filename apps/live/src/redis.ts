import Redis from "ioredis";
import { logger } from "@plane/logger";
import { env } from "./env";

export class RedisManager {
  private static instance: RedisManager;
  private redisClient: Redis | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.redisClient && this.isConnected) {
      logger.info("REDIS_MANAGER: client already initialized and connected");
      return;
    }

    if (this.connectionPromise) {
      logger.info("REDIS_MANAGER: Redis connection already in progress, waiting...");
      await this.connectionPromise;
      return;
    }

    this.connectionPromise = this.connect();
    await this.connectionPromise;
  }

  private getRedisUrl(): string {
    const redisUrl = env.REDIS_URL;
    const redisHost = env.REDIS_HOST;
    const redisPort = env.REDIS_PORT;

    if (redisUrl) {
      return redisUrl;
    }

    if (redisHost && redisPort && !Number.isNaN(Number(redisPort))) {
      return `redis://${redisHost}:${redisPort}`;
    }

    return "";
  }

  private async connect(): Promise<void> {
    try {
      const redisUrl = this.getRedisUrl();

      if (!redisUrl) {
        logger.warn("REDIS_MANAGER: No Redis URL provided, Redis functionality will be disabled");
        this.isConnected = false;
        return;
      }

      // Configuration optimized for BOTH regular operations AND pub/sub
      // HocuspocusRedis uses .duplicate() which inherits these settings
      this.redisClient = new Redis(redisUrl, {
        lazyConnect: false, // Connect immediately for reliability (duplicates inherit this)
        keepAlive: 30000,
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true, // Keep commands queued during reconnection
        retryStrategy: (times: number) => {
          // Exponential backoff with max 2 seconds
          const delay = Math.min(times * 50, 2000);
          logger.info(`REDIS_MANAGER: Reconnection attempt ${times}, delay: ${delay}ms`);
          return delay;
        },
      });

      // Set up event listeners
      this.redisClient.on("connect", () => {
        logger.info("REDIS_MANAGER: Redis client connected");
        this.isConnected = true;
      });

      this.redisClient.on("ready", () => {
        logger.info("REDIS_MANAGER: Redis client ready");
        this.isConnected = true;
      });

      this.redisClient.on("error", (error) => {
        logger.error("REDIS_MANAGER: Redis client error:", error);
        this.isConnected = false;
      });

      this.redisClient.on("close", () => {
        logger.warn("REDIS_MANAGER: Redis client connection closed");
        this.isConnected = false;
      });

      this.redisClient.on("reconnecting", () => {
        logger.info("REDIS_MANAGER: Redis client reconnecting...");
        this.isConnected = false;
      });

      await this.redisClient.ping();
      logger.info("REDIS_MANAGER: Redis connection test successful");
    } catch (error) {
      logger.error("REDIS_MANAGER: Failed to initialize Redis client:", error);
      this.isConnected = false;
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  public getClient(): Redis | null {
    if (!this.redisClient || !this.isConnected) {
      logger.warn("REDIS_MANAGER: Redis client not available or not connected");
      return null;
    }
    return this.redisClient;
  }

  public isClientConnected(): boolean {
    return this.isConnected && this.redisClient !== null;
  }

  public async disconnect(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        logger.info("REDIS_MANAGER: Redis client disconnected gracefully");
      } catch (error) {
        logger.error("REDIS_MANAGER: Error disconnecting Redis client:", error);
        // Force disconnect if quit fails
        this.redisClient.disconnect();
      } finally {
        this.redisClient = null;
        this.isConnected = false;
      }
    }
  }

  // Convenience methods for common Redis operations
  public async set(key: string, value: string, ttl?: number): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      if (ttl) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`REDIS_MANAGER: Error setting Redis key ${key}:`, error);
      return false;
    }
  }

  public async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      return await client.get(key);
    } catch (error) {
      logger.error(`REDIS_MANAGER: Error getting Redis key ${key}:`, error);
      return null;
    }
  }

  public async del(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error(`REDIS_MANAGER: Error deleting Redis key ${key}:`, error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`REDIS_MANAGER: Error checking Redis key ${key}:`, error);
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const result = await client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`REDIS_MANAGER: Error setting expiry for Redis key ${key}:`, error);
      return false;
    }
  }
}

// Export a default instance for convenience
export const redisManager = RedisManager.getInstance();
