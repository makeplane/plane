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

// Environment variable validation schema
const envSchema = z.object({
  NODE_ENV: z.string().default("production"),
  PORT: z.string().default("3000").transform(Number),

  // Node Runner execution configuration
  EXECUTION_TIMEOUT_MS: z.string().default("10000").transform(Number),
  INIT_TIMEOUT_MS: z.string().default("5000").transform(Number),
  ISOLATE_MEMORY_MB: z.string().default("128").transform(Number),

  // API configuration
  API_BASE_URL: z.string().url("API_BASE_URL must be a valid URL"),

  // Allowed domains for sandboxed fetch (comma-separated)
  ALLOWED_DOMAINS: z.string().default(""),
});

const validateEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    logger.error("Invalid environment variables:", { errors: result.error.format() });
    process.exit(1);
  }
  return result.data;
};

export const env = validateEnv();

// Environment-based configuration (loaded once at startup)
export const serverConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  timeoutMs: env.EXECUTION_TIMEOUT_MS,
  initTimeoutMs: env.INIT_TIMEOUT_MS,
  memoryLimitMb: env.ISOLATE_MEMORY_MB,
  apiBaseUrl: env.API_BASE_URL,
  allowedDomains: env.ALLOWED_DOMAINS
    ? env.ALLOWED_DOMAINS.split(",")
        .map((d) => d.trim())
        .filter(Boolean)
    : [],
};
