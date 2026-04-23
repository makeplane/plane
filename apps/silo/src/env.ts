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

import * as dotenv from "dotenv";
import { z } from "zod";
import { logger } from "@plane/logger";
dotenv.config();

const envSchema = z.object({
  // Sentry Env Variables
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().default("plane-hq"),
  SENTRY_PROJECT: z.string().default("plane-silo"),
  SENTRY_RELEASE_VERSION: z.string().default("1.0.0"),
  // Datadog Environment Variables
  DD_API_KEY: z.string().optional(),
  DD_TRACE_AGENT_HOSTNAME: z.string().optional().default("localhost"),
  DD_ENV: z.string().default("production"),
  DD_SERVICE: z.string().default("silo"),
  DD_VERSION: z.string().default("1.0.0"),
  // App Env Variables
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BATCH_SIZE: z.string().default("50"),
  PORT: z.string().default("3000"),
  DEDUP_INTERVAL: z.string().optional().default("3"),
  DB_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  AMQP_URL: z.string().default("amqp://guest:guest@localhost:5672"),
  CORS_ALLOWED_ORIGINS: z.string().default("https://app.plane.so"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PG_SCHEMA: z.string().optional(),
  MAX_STORE_CONNECTION_ATTEMPTS: z.string().default("20"),
  MAX_DB_CONNECTION_ATTEMPTS: z.string().default("5"),
  IMPORTERS_QUEUE_NAME: z.string().default("celery"),
  APP_BASE_URL: z
    .string()
    .default("")
    .transform((str) => str.replace(/\/$/, "")),
  API_BASE_URL: z
    .string()
    .default("")
    // Remove the slash at the end of the URL
    .transform((str) => str.replace(/\/$/, "")),
  API_INTERNAL_BASE_URL: z
    .string()
    .default("")
    .transform((str) => str.replace(/\/$/, "")),
  SPACE_BASE_URL: z
    .string()
    .default("https://sites.plane.so")
    .transform((str) => str.replace(/\/$/, "")),
  SILO_API_BASE_URL: z
    .string()
    .default("")
    .transform((str) => str.replace(/\/$/, "")),
  IS_SELF_MANAGED: z.string().default("1"),
  SILO_BASE_PATH: z.string().default("/silo"),
  WEBHOOK_SECRET: z.string().default("plane-silo"),
  MQ_PREFETCH_COUNT: z.string().default("5"),
  SILO_HMAC_SECRET_KEY: z.string().default(""),
  SILO_FILE_SIZE_LIMIT: z.string().default("104857600"), // 100MB in bytes
  // Feature Flags Env Variables
  FEATURE_FLAG_SERVER_BASE_URL: z.string().optional(),
  FEATURE_FLAG_SERVER_AUTH_TOKEN: z.string().optional(),
  // Jira Env Variables
  JIRA_OAUTH_ENABLED: z.string().default("0"),
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  JIRA_SERVER_OAUTH_ENABLED: z.string().default("0"),
  // Linear Env Variables
  LINEAR_OAUTH_ENABLED: z.string().default("0"),
  LINEAR_CLIENT_ID: z.string().optional(),
  LINEAR_CLIENT_SECRET: z.string().optional(),
  // GitHub Env Variables
  GITHUB_APP_NAME: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  GITHUB_PRIVATE_KEY: z.string().optional(),
  // GitLab Env Variables
  GITLAB_CLIENT_ID: z.string().optional(),
  GITLAB_CLIENT_SECRET: z.string().optional().optional(),
  // Asana Env Variables
  ASANA_OAUTH_ENABLED: z.string().default("0"),
  ASANA_CLIENT_ID: z.string().optional(),
  ASANA_CLIENT_SECRET: z.string().optional(),
  // Slack Env Variables
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  // Sentry Env Variables
  SENTRY_BASE_URL: z
    .string()
    .optional()
    .default("https://sentry.io")
    .transform((str) => str.replace(/\/$/, "")),
  SENTRY_CLIENT_ID: z.string().optional(),
  SENTRY_CLIENT_SECRET: z.string().optional(),
  SENTRY_INTEGRATION_SLUG: z.string().optional().default("plane"),
  // Flatfile Env Variables
  FLATFILE_API_KEY: z.string().optional(),
  // AES Env Variables
  AES_SECRET_KEY: z.string().optional(),
  AES_SALT: z.string().default("aes-salt"),
  // AWS S3 Env Variables
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_ENDPOINT_URL: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().default("uploads"),
  // AWS Secrets Manager (optional - for ElastiCache / AmazonMQ on AWS)
  AWS_ROLE_ARN: z.string().optional(),
  // EKS Pod Identity (alternative to AWS_ROLE_ARN for Secrets Manager)
  AWS_CONTAINER_CREDENTIALS_FULL_URI: z.string().optional(),
  AWS_SECRET_CACHE_TTL: z.string().default("300").transform(Number),
  // ElastiCache (Redis)
  ELASTICACHE_SECRET_ARN: z.string().optional(),
  REDIS_AUTH_TOKEN_KEY: z.string().default("REDIS_AUTH_TOKEN"),
  REDIS_HOST_KEY: z.string().default("REDIS_HOST"),
  REDIS_PORT_KEY: z.string().default("REDIS_PORT"),
  // RDS (PostgreSQL)
  RDS_SECRET_ARN: z.string().optional(),
  RDS_DB_NAME_KEY: z.string().default("DB_NAME"),
  RDS_DB_HOST_KEY: z.string().default("DB_HOST"),
  RDS_DB_PASSWORD_KEY: z.string().default("DB_PASSWORD"),
  RDS_DB_PORT_KEY: z.string().default("DB_PORT"),
  RDS_DB_USERNAME_KEY: z.string().default("DB_USERNAME"),
  // AmazonMQ (RabbitMQ)
  AMAZONMQ_SECRET_ARN: z.string().optional(),
  RABBITMQ_USER_KEY: z.string().default("RABBITMQ_USER"),
  RABBITMQ_PASSWORD_KEY: z.string().default("RABBITMQ_PASSWORD"),
  RABBITMQ_HOST_KEY: z.string().default("RABBITMQ_HOST"),
  RABBITMQ_PORT_KEY: z.string().default("RABBITMQ_PORT"),
  RABBITMQ_VHOST_KEY: z.string().default("RABBITMQ_VHOST"),
  // Internal Plane App Env Variables
  PRD_AGENT_CLIENT_ID: z.string().optional(),
  PRD_AGENT_CLIENT_SECRET: z.string().optional(),

  // Cursor Agent
  CURSOR_WEBHOOK_SECRET: z.string().min(32).default("TTqazTcoBajYKzIAeIKFZeTX9czAoUsG"),

  // AI Service
  AI_SERVICE_BASE_URL: z
    .string()
    .default("")
    .transform((str) => str.replace(/\/$/, "")),
});

// Validate the environment variables
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error("❌ Invalid environment variables:", result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

// ---------------------------------------------------------------------------
// AWS Secrets Manager integration
// Resolves AMQP_URL and REDIS_URL from AWS Secrets Manager when configured.
// Call resolveSecrets() once at startup before opening any connections.
// A background interval re-fetches secrets based on AWS_SECRET_CACHE_TTL so
// that reconnections (e.g. after a connection drop) pick up rotated credentials.
// ---------------------------------------------------------------------------

let refreshTimer: ReturnType<typeof setInterval> | undefined;

/**
 * Fetch a secret from AWS Secrets Manager (lazy-imports the SDK so non-AWS
 * environments never pay for it).
 */
async function fetchSecret(secretArn: string, region: string): Promise<Record<string, unknown>> {
  const { getSecret } = await import("@/lib/aws-secrets");
  return getSecret(secretArn, region, true);
}

function isBareHostPort(url: string): boolean {
  return !/^(amqps?|rediss?):\/\//i.test(url);
}

function secretString(secret: Record<string, unknown>, key: string, fallback = ""): string {
  const val = secret[key];
  return typeof val === "string" ? val : fallback;
}

async function resolveAmqpUrl(): Promise<string> {
  if (!env.AMAZONMQ_SECRET_ARN) return env.AMQP_URL;

  const secret = await fetchSecret(env.AMAZONMQ_SECRET_ARN, env.AWS_REGION);
  const user = encodeURIComponent(secretString(secret, env.RABBITMQ_USER_KEY));
  const password = encodeURIComponent(secretString(secret, env.RABBITMQ_PASSWORD_KEY));

  // If AMQP_URL is a bare host:port, use it as the endpoint
  if (isBareHostPort(env.AMQP_URL)) {
    const vhost = encodeURIComponent(secretString(secret, env.RABBITMQ_VHOST_KEY, "/"));
    return `amqps://${user}:${password}@${env.AMQP_URL}/${vhost}`;
  }

  // No usable AMQP_URL — build entirely from the secret
  const host = secretString(secret, env.RABBITMQ_HOST_KEY);
  const port = Number(secret[env.RABBITMQ_PORT_KEY] ?? 5671);
  const vhost = encodeURIComponent(secretString(secret, env.RABBITMQ_VHOST_KEY, "/"));
  return `amqps://${user}:${password}@${host}:${port}/${vhost}`;
}

async function resolveRedisUrl(): Promise<string> {
  if (!env.ELASTICACHE_SECRET_ARN) return env.REDIS_URL;

  const secret = await fetchSecret(env.ELASTICACHE_SECRET_ARN, env.AWS_REGION);
  const token = encodeURIComponent(secretString(secret, env.REDIS_AUTH_TOKEN_KEY));

  // If REDIS_URL is a bare host:port, use it as the endpoint
  if (isBareHostPort(env.REDIS_URL)) {
    return `rediss://:${token}@${env.REDIS_URL}`;
  }

  // No usable REDIS_URL — build entirely from the secret
  const host = secretString(secret, env.REDIS_HOST_KEY);
  const port = Number(secret[env.REDIS_PORT_KEY] ?? 6379);
  return `rediss://:${token}@${host}:${port}`;
}

export async function resolveDatabaseUrl(forceRefresh = false): Promise<string> {
  // No ARN configured — use the env var directly; Secrets Manager not involved.
  if (!env.RDS_SECRET_ARN) return env.DATABASE_URL ?? "";
  // Fast path: URL already resolved and no forced refresh requested.
  if (!forceRefresh && env.DATABASE_URL) return env.DATABASE_URL;

  const secret = await fetchSecret(env.RDS_SECRET_ARN, env.AWS_REGION);
  const user = encodeURIComponent(secretString(secret, env.RDS_DB_USERNAME_KEY));
  const password = encodeURIComponent(secretString(secret, env.RDS_DB_PASSWORD_KEY));
  const host = secretString(secret, env.RDS_DB_HOST_KEY);
  const port = Number(secret[env.RDS_DB_PORT_KEY] ?? 5432);
  const name = secretString(secret, env.RDS_DB_NAME_KEY);
  return `postgresql://${user}:${password}@${host}:${port}/${name}`;
}

async function refreshSecrets(): Promise<void> {
  const [amqpUrl, redisUrl, databaseUrl] = await Promise.all([
    resolveAmqpUrl(),
    resolveRedisUrl(),
    resolveDatabaseUrl(),
  ]);
  (env as Record<string, unknown>).AMQP_URL = amqpUrl;
  (env as Record<string, unknown>).REDIS_URL = redisUrl;
  if (databaseUrl) {
    (env as Record<string, unknown>).DATABASE_URL = databaseUrl;
  }
}

/**
 * Resolve AMQP_URL / REDIS_URL from AWS Secrets Manager (if configured) and
 * start a background refresh interval so reconnections pick up rotated creds.
 *
 * Safe to call in non-AWS environments — it no-ops when the secret ARNs are
 * not set.
 */
export async function resolveSecrets(): Promise<void> {
  // True when either IRSA (AWS_ROLE_ARN) or EKS Pod Identity
  // (AWS_CONTAINER_CREDENTIALS_FULL_URI) is present.
  const hasAwsCredentials = Boolean((env.AWS_ROLE_ARN ?? "").trim() || env.AWS_CONTAINER_CREDENTIALS_FULL_URI);
  if (!hasAwsCredentials || (!env.ELASTICACHE_SECRET_ARN && !env.AMAZONMQ_SECRET_ARN)) {
    return; // nothing to resolve
  }

  await refreshSecrets();
  logger.info("AWS Secrets Manager: resolved connection URLs");

  // Schedule periodic refresh so reconnections use fresh credentials
  const ttlMs = env.AWS_SECRET_CACHE_TTL * 1000;
  if (ttlMs > 0 && !refreshTimer) {
    refreshTimer = setInterval(() => {
      refreshSecrets().catch((err: unknown) => {
        logger.error("AWS Secrets Manager: failed to refresh secrets", {
          error: err,
        });
      });
    }, ttlMs);
    // Allow the process to exit even if the timer is still running
    refreshTimer.unref();
  }
}
