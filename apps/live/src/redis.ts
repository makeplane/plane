import Redis from "ioredis";
import { logger } from "@plane/logger";

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
      logger.info("Redis client already initialized and connected");
      return;
    }

    if (this.connectionPromise) {
      logger.info("Redis connection already in progress, waiting...");
      await this.connectionPromise;
      return;
    }

    this.connectionPromise = this.connect();
    await this.connectionPromise;
  }

  private getRedisUrl(): string {
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

  private async connect(): Promise<void> {
    try {
      const redisUrl = this.getRedisUrl();

      if (!redisUrl) {
        logger.warn("No Redis URL provided, Redis functionality will be disabled");
        this.isConnected = false;
        return;
      }

      this.redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3,
      });

      // Set up event listeners
      this.redisClient.on("connect", () => {
        logger.info("Redis client connected");
        this.isConnected = true;
      });

      this.redisClient.on("ready", () => {
        logger.info("Redis client ready");
        this.isConnected = true;
      });

      this.redisClient.on("error", (error) => {
        logger.error("Redis client error:", error);
        this.isConnected = false;
      });

      this.redisClient.on("close", () => {
        logger.warn("Redis client connection closed");
        this.isConnected = false;
      });

      this.redisClient.on("reconnecting", () => {
        logger.info("Redis client reconnecting...");
        this.isConnected = false;
      });

      // Connect to Redis
      await this.redisClient.connect();

      // Test the connection
      await this.redisClient.ping();
      logger.info("Redis connection test successful");
    } catch (error) {
      logger.error("Failed to initialize Redis client:", error);
      this.isConnected = false;
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  public getClient(): Redis | null {
    if (!this.redisClient || !this.isConnected) {
      logger.warn("Redis client not available or not connected");
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
        logger.info("Redis client disconnected gracefully");
      } catch (error) {
        logger.error("Error disconnecting Redis client:", error);
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
      logger.error(`Error setting Redis key ${key}:`, error);
      return false;
    }
  }

  public async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      return await client.get(key);
    } catch (error) {
      logger.error(`Error getting Redis key ${key}:`, error);
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
      logger.error(`Error deleting Redis key ${key}:`, error);
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
      logger.error(`Error checking Redis key ${key}:`, error);
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
      logger.error(`Error setting expiry for Redis key ${key}:`, error);
      return false;
    }
  }
}

// Export a default instance for convenience
export const redisManager = RedisManager.getInstance();
