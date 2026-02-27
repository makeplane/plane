/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import Redis from "ioredis";
import { logger } from "@plane/logger";
import { getSecret } from "./lib/aws-secrets";
import { env } from "./env";

export class RedisManager {
  private static instance: RedisManager;
  private redisClient: Redis | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private resolvedRedisUrl: string = "";
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private isRefreshing: boolean = false;

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
    if (this.redisClient && env.ELASTICACHE_SECRET_ARN) {
      this.scheduleSecretRefresh();
    }
  }

  private isBareRedisHostPort(url: string): boolean {
    return Boolean(url) && !url.startsWith("redis://") && !url.startsWith("rediss://");
  }

  /**
   * Resolves Redis URL: REDIS_URL takes precedence; else if AWS credentials are present
   * (IRSA via AWS_ROLE_ARN, or EKS Pod Identity via AWS_CONTAINER_CREDENTIALS_FULL_URI)
   * and ELASTICACHE_SECRET_ARN is set, fetches from AWS Secrets Manager (with optional
   * forceRefresh); else REDIS_HOST:REDIS_PORT.
   */
  private async resolveRedisUrl(forceRefresh = false): Promise<string> {
    const awsRoleArn = (env.AWS_ROLE_ARN ?? "").trim();
    const hasPodIdentity = Boolean(env.AWS_CONTAINER_CREDENTIALS_FULL_URI);
    const hasElasticache = Boolean((awsRoleArn || hasPodIdentity) && env.ELASTICACHE_SECRET_ARN);

    if (env.REDIS_URL && !this.isBareRedisHostPort(env.REDIS_URL)) {
      return env.REDIS_URL;
    }

    if (env.REDIS_URL && this.isBareRedisHostPort(env.REDIS_URL) && hasElasticache) {
      const secret = await getSecret(env.ELASTICACHE_SECRET_ARN!, env.AWS_REGION, forceRefresh);
      const tokenKey = env.REDIS_AUTH_TOKEN_KEY ?? "REDIS_AUTH_TOKEN";
      const token = (secret[tokenKey] as string) ?? "";
      return `rediss://:${encodeURIComponent(token)}@${env.REDIS_URL}`;
    }

    if (!env.REDIS_URL && hasElasticache) {
      const secret = await getSecret(env.ELASTICACHE_SECRET_ARN!, env.AWS_REGION, forceRefresh);
      const tokenKey = env.REDIS_AUTH_TOKEN_KEY ?? "REDIS_AUTH_TOKEN";
      const hostKey = env.REDIS_HOST_KEY ?? "REDIS_HOST";
      const portKey = env.REDIS_PORT_KEY ?? "REDIS_PORT";
      const token = (secret[tokenKey] as string) ?? "";
      const host = (secret[hostKey] as string) ?? "";
      const port = Number(secret[portKey] ?? 6379);
      return `rediss://:${encodeURIComponent(token)}@${host}:${port}`;
    }

    const redisHost = env.REDIS_HOST;
    const redisPort = env.REDIS_PORT;
    if (redisHost && redisPort && !Number.isNaN(Number(redisPort))) {
      return `redis://${redisHost}:${redisPort}`;
    }
    return "";
  }

  private async connect(): Promise<void> {
    try {
      const redisUrl = await this.resolveRedisUrl();
      this.resolvedRedisUrl = redisUrl;

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

      this.redisClient.on("error", (error: Error & { code?: string }) => {
        logger.error("REDIS_MANAGER: Redis client error:", error);
        this.isConnected = false;
        const msg = error?.message ?? "";
        if (env.ELASTICACHE_SECRET_ARN && (msg.includes("WRONGPASS") || msg.includes("NOAUTH"))) {
          logger.info("REDIS_MANAGER: Auth error detected, refreshing credentials and reconnecting");
          void this.refreshCredentialsAndReconnect();
        }
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

  private async refreshCredentialsAndReconnect(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    try {
      await this.disconnect();
      this.connectionPromise = this.connect();
      await this.connectionPromise;
    } catch (err) {
      logger.error("REDIS_MANAGER: Failed to refresh credentials and reconnect:", err);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * When using ElastiCache (ELASTICACHE_SECRET_ARN), periodically re-resolve URL from Secrets Manager
   * and reconnect if the URL changed (e.g. after credential rotation).
   */
  private scheduleSecretRefresh(): void {
    if (this.refreshIntervalId) return;
    const ttlMs = (env.AWS_SECRET_CACHE_TTL ?? 300) * 1000;
    this.refreshIntervalId = setInterval(() => {
      void (async () => {
        try {
          const newUrl = await this.resolveRedisUrl(true);
          if (newUrl && newUrl !== this.resolvedRedisUrl) {
            logger.info("REDIS_MANAGER: Secret changed, reconnecting with new credentials");
            if (this.refreshIntervalId) {
              clearInterval(this.refreshIntervalId);
              this.refreshIntervalId = null;
            }
            await this.disconnect();
            await this.connect();
            if (env.ELASTICACHE_SECRET_ARN) this.scheduleSecretRefresh();
          }
        } catch (err) {
          logger.error("REDIS_MANAGER: Error during scheduled secret refresh:", err);
        }
      })();
    }, ttlMs);
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
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
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
