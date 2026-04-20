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

dotenv.config();

// Environment variable validation
const envSchema = z.object({
  APP_VERSION: z.string().default("1.0.0"),
  NODE_ENV: z.string().default("production"),
  HOSTNAME: z.string().optional(),
  PORT: z.string().default("3000"),
  API_BASE_URL: z.string().url("API_BASE_URL must be a valid URL"),
  // CORS configuration
  CORS_ALLOWED_ORIGINS: z.string().default(""),
  // Live running location
  LIVE_BASE_PATH: z.string().default("/live"),
  // Compression options
  COMPRESSION_LEVEL: z.string().default("6").transform(Number),
  COMPRESSION_THRESHOLD: z.string().default("5000").transform(Number),
  // secret
  LIVE_SERVER_SECRET_KEY: z.string(),
  // Redis configuration
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().default("6379").transform(Number),
  REDIS_URL: z.string().optional(),
  // AWS Secrets Manager (ElastiCache) - same env vars as API for consistency
  ELASTICACHE_SECRET_ARN: z.string().optional(),
  AWS_ROLE_ARN: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  REDIS_AUTH_TOKEN_KEY: z.string().optional(),
  REDIS_HOST_KEY: z.string().optional(),
  REDIS_PORT_KEY: z.string().optional(),
  AWS_SECRET_CACHE_TTL: z.string().default("300").transform(Number),
  // EKS Pod Identity (alternative to AWS_ROLE_ARN for Secrets Manager)
  AWS_CONTAINER_CREDENTIALS_FULL_URI: z.string().optional(),
  // Iframely configuration
  IFRAMELY_URL: z.string().optional(),
  // PDF export tuning — bump on CPU-throttled pods
  PDF_EXPORT_RENDER_TIMEOUT_MS: z.string().default("60000").transform(Number),
  PDF_EXPORT_KEEPALIVE_INTERVAL_MS: z.string().default("15000").transform(Number),
  // Web origin used to build absolute links in rendered exports
  WEB_BASE_URL: z.string().optional(),
  APP_BASE_URL: z.string().optional(),
  // Sentry
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),
  SENTRY_TRACES_SAMPLE_RATE: z.string().default("0.5").transform(Number),
});

const validateEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(result.error.format(), null, 4));
    process.exit(1);
  }
  return result.data;
};

export const env = validateEnv();
