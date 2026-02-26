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

import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { logger } from "@plane/logger";

interface CacheEntry {
  value: Record<string, unknown>;
  fetchedAt: number;
}
const secretCache = new Map<string, CacheEntry>();

/**
 * Fetch and TTL-cache a secret from AWS Secrets Manager.
 * Returns the parsed JSON secret object. Uses AWS_SECRET_CACHE_TTL (seconds) for cache TTL.
 */
export async function getSecret(
  secretArn: string,
  region: string,
  forceRefresh = false
): Promise<Record<string, unknown>> {
  const cacheTtl = parseInt(process.env.AWS_SECRET_CACHE_TTL ?? "300", 10) * 1000;
  const key = `${secretArn}:${region}`;
  const now = Date.now();
  if (!forceRefresh && secretCache.has(key)) {
    const entry = secretCache.get(key)!;
    if (now - entry.fetchedAt < cacheTtl) return { ...entry.value };
  }
  const client = new SecretsManagerClient({ region });
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  const value = JSON.parse(response.SecretString ?? "{}") as Record<string, unknown>;
  secretCache.set(key, { value, fetchedAt: now });
  logger.info("SECRETS_MANAGER: Refreshed secret", { secretArn });
  return { ...value };
}
