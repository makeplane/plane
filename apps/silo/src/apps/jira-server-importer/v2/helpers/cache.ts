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

import type { JiraConfig } from "@plane/etl/jira-server";
import { logger } from "@plane/logger";
import type { TImportJob } from "@plane/types";
import { Store } from "@/worker/base";

export const withCache = async <T>(key: string, job: TImportJob<JiraConfig>, fn: () => Promise<T>): Promise<T> => {
  const store = Store.getInstance();
  const cacheKey = `JiraServerImporter:cache:${job.id}:${job.workspace_slug}:${job.project_id}:${key}`;

  try {
    const cached = await store.get(cacheKey);
    if (cached) {
      logger.info(`[${job.id}] Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`[${job.id}] Cache get failed for ${cacheKey}`, { error });
  }

  logger.info(`[${job.id}] Cache miss for ${cacheKey}`);
  const result = await fn();

  try {
    logger.info(`[${job.id}] Cache set for ${cacheKey}`, { data: result });
    await store.set(cacheKey, JSON.stringify(result), 60 * 60 * 24); // 24 hours
  } catch (error) {
    logger.warn(`[${job.id}] Cache set failed for ${cacheKey}`, { error });
  }

  return result;
};

export const flushJob = async (jobId: string): Promise<{ cache: Map<string, string>; data: Map<string, string> }> => {
  try {
    const store = Store.getInstance();
    logger.info(`[${jobId}] Flushing job`);
    const cache = await flushJobCache(store, jobId);
    const data = await flushJobData(store, jobId);
    return { ...cache, ...data };
  } catch (error) {
    logger.warn(`[${jobId}] Failed to flush job, silent failure`, { error });
    return { cache: new Map(), data: new Map() };
  }
};

export const flushJobCache = async (store: Store, jobId: string): Promise<{ cache: Map<string, string> }> => {
  try {
    logger.info(`[${jobId}] Flushing cache`);
    const cacheKey = `JiraServerImporter:cache:${jobId}:*`;
    await store.del(cacheKey);
    logger.info(`[${jobId}] Flushed cache`, { cacheKey });
    return { cache: new Map() };
  } catch (error) {
    logger.warn(`[${jobId}] Failed to flush cache, silent failure`, { error });
    return { cache: new Map() };
  }
};

export const flushJobData = async (store: Store, jobId: string): Promise<{ data: Map<string, string> }> => {
  try {
    logger.info(`[${jobId}] Flushing job data`);
    const dataKey = `job:${jobId}:*`;
    await store.del(dataKey);
    logger.info(`[${jobId}] Flushed job data`, { dataKey });
    return { data: new Map() };
  } catch (error) {
    logger.warn(`[${jobId}] Failed to flush job data, silent failure`, { error });
    return { data: new Map() };
  }
};
