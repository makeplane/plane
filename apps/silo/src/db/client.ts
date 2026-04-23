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

import pg from "pg";
import { logger } from "@plane/logger";
import { env, resolveDatabaseUrl } from "@/env";

// PostgreSQL error codes that indicate SSL/connection configuration issues
// These errors can often be resolved by retrying with sslmode=no-verify
const SSL_RELATED_ERROR_CODES = [
  "28000", // Authentication failure (SSL cert verification)
  "08006", // Connection failure (no pg_hba.conf entry, SSL mismatch)
  "08001", // Client unable to establish connection (SSL/network issues)
  "08004", // Server rejected connection (SSL policy conflicts)
  "08P01", // Protocol violation (SSL version/cipher mismatch)
] as const;

// PostgreSQL SQLSTATE codes that indicate a password/auth failure.
// These trigger a credential refresh rather than a plain retry.
const AUTH_ERROR_CODES = [
  "28P01", // password authentication failed for user
  "28000", // authentication failure (covers LDAP/GSSAPI/cert auth too)
] as const;

/**
 * Database class
 * @description This class is used to connect to the database and execute queries
 * @example
 * const db = DB.getInstance();
 * const users = await db.query("SELECT * FROM users");
 * or write a query in query.ts and then use it
 */
class DB {
  private static instance: DB;
  private pool?: pg.Pool;
  private isConnected = false;
  private isRefreshing = false;

  private constructor() {}

  public static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }

  public async init(): Promise<void> {
    if (!this.pool) {
      await this.connect();
    }
    if (env.RDS_SECRET_ARN) {
      this.scheduleSecretRefresh();
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnected) return;
    let dbURI = await resolveDatabaseUrl();
    if (!dbURI) {
      logger.warn("Database URL is not set.. skipping database connection");
      return;
    }
    const maxAttempts = parseInt(env.MAX_DB_CONNECTION_ATTEMPTS) || 3;
    const retryDelay = 1000;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        this.pool = new pg.Pool({
          connectionString: dbURI,
          application_name: "silo",
        });
        // Attach pool-level error listener so idle client auth failures are handled.
        this.pool.on("error", (error: Error & { code?: string }) => {
          logger.error("DB_POOL: Idle client error", { error });
          if (
            env.RDS_SECRET_ARN &&
            error.code &&
            AUTH_ERROR_CODES.includes(error.code as (typeof AUTH_ERROR_CODES)[number])
          ) {
            logger.info("DB_POOL: Auth error on idle client — refreshing credentials and reconnecting");
            void this.refreshCredentialsAndReconnect();
          }
        });
        // Test the connection
        await this.pool.query("SELECT 1");
        this.isConnected = true;
        logger.info("✅----Successfully connected to database----");
        break;
      } catch (error) {
        logger.error("❌----Error connecting to database----", { error });
        // Handle SSL-related connection errors only
        if (
          error instanceof Error &&
          "code" in error &&
          SSL_RELATED_ERROR_CODES.includes(error.code as any) &&
          !dbURI.includes("sslmode=no-verify")
        ) {
          logger.info("🔄----Retrying connection with SSL Mode no verify----");
          dbURI = dbURI?.concat("?sslmode=no-verify");
        }
        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Force-refresh credentials from Secrets Manager and reconnect the pool.
   * Guarded by isRefreshing to prevent concurrent refresh storms when multiple
   * queries fail simultaneously after a secret rotation.
   */
  private async refreshCredentialsAndReconnect(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    logger.info(
      "DB_POOL: Refreshing credentials from Secrets Manager and reconnecting to the follower PostgreSQL database."
    );
    try {
      const freshUrl = await resolveDatabaseUrl(true);
      if (freshUrl) {
        (env as Record<string, unknown>).DATABASE_URL = freshUrl;
      }
      await this.close();
      await this.connect();
      logger.info("DB_POOL: Successfully reconnected with refreshed credentials.");
    } catch (err) {
      logger.error("DB_POOL: Failed to refresh credentials and reconnect", { error: err });
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Proactively refresh credentials every TTL seconds and reconnect if the URL changed.
   * Mirrors the pattern in apps/live/src/redis.ts RedisManager.scheduleSecretRefresh().
   */
  private scheduleSecretRefresh(): void {
    const ttlMs = (env.AWS_SECRET_CACHE_TTL ?? 300) * 1000;
    if (ttlMs <= 0) return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const freshUrl = await resolveDatabaseUrl(true);
          if (freshUrl && freshUrl !== env.DATABASE_URL) {
            logger.info("DB_POOL: Secret rotated — reconnecting with new credentials.");
            (env as Record<string, unknown>).DATABASE_URL = freshUrl;
            await this.close();
            await this.connect();
          }
        } catch (err) {
          logger.error("DB_POOL: Error during scheduled secret refresh", { error: err });
        }
      })();
    }, ttlMs);
    // Allow the process to exit even while the timer is active.
    timer.unref();
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.pool) {
      await this.connect();
    }
    try {
      logger.info(`Executing query: ${sql}`, { params });
      const result = await this.pool!.query(sql, params);
      return result.rows;
    } catch (error) {
      // Auth errors at query time (not covered by the idle-client pool listener).
      // Refresh credentials and retry once before propagating.
      const code = (error as any)?.code as string | undefined;
      if (env.RDS_SECRET_ARN && code && AUTH_ERROR_CODES.includes(code as (typeof AUTH_ERROR_CODES)[number])) {
        logger.warn("DB_POOL: Auth error during query — refreshing credentials and retrying.");
        await this.refreshCredentialsAndReconnect();
        const result = await this.pool!.query(sql, params);
        return result.rows;
      }
      logger.error("Error querying database", { sql, params, error });
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        logger.info("Database connection closed");
        this.isConnected = false;
        this.pool = undefined;
      } catch (error) {
        logger.error("Error closing database connection", { error });
        throw error;
      }
    }
  }
}

export default DB;

export { DB };
