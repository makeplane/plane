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

import type { IStorageService } from "@/apps/jira-server-importer/v2/types";
import { Store } from "@/worker/base";
import { logger } from "@plane/logger";

/**
 * Storage service for managing entity mappings in Redis
 * Uses Redis Hash for efficient O(1) lookups
 * Singleton pattern ensures only one instance exists
 */
class RedisStorageService implements IStorageService {
  private readonly CHUNK_SIZE = 1000; // Batch operations in chunks
  private readonly TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
  private readonly store: Store = Store.getInstance();

  constructor() {}

  /**
   * Lookup Plane entity IDs from external source IDs
   * Performs chunked lookups to handle large datasets efficiently
   *
   * @param jobId - Import job ID
   * @param entityType - Type of entity (e.g., 'users', 'labels', 'issues')
   * @param externalIds - Array of external IDs to lookup
   * @returns Map of external_id -> plane_id
   *
   * @example
   * const userMap = await storageService.lookup(
   *   'job-123',
   *   'users',
   *   ['jira_user_1', 'jira_user_2']
   * );
   * // Returns: Map { 'jira_user_1' => 'plane_uuid_1', 'jira_user_2' => 'plane_uuid_2' }
   */
  async lookupMapping(jobId: string, entityType: string, externalIds: string[]): Promise<Map<string, string>> {
    if (externalIds.length === 0) return new Map();

    const hashKey = this.getMappingKey(jobId, entityType);
    const result = new Map<string, string>();

    // Batch lookups in chunks to avoid large operations
    for (let i = 0; i < externalIds.length; i += this.CHUNK_SIZE) {
      const chunk = externalIds.slice(i, i + this.CHUNK_SIZE);
      const chunkResults = await this.store.getMapFields(hashKey, chunk);

      // Merge chunk results into final result
      chunkResults.forEach((value, key) => {
        result.set(key, value);
      });
    }

    return result;
  }

  /**
   * Retrieve all entity mappings for an entity type
   * Returns the entire mapping hash without filtering
   *
   * @param jobId - Import job ID
   * @param entityType - Type of entity (e.g., 'users', 'labels', 'issues')
   * @returns Map of all external_id -> plane_id mappings for this entity type
   *
   * @example
   * const allUserMappings = await storageService.retrieveMapping('job-123', 'users');
   * // Returns: Map { 'jira_user_1' => 'plane_uuid_1', 'jira_user_2' => 'plane_uuid_2', ... }
   */
  async retrieveMapping(jobId: string, entityType: string): Promise<Map<string, string>> {
    const hashKey = this.getMappingKey(jobId, entityType);
    const result = await this.store.getMap(hashKey);
    return result ?? new Map();
  }

  /**
   * Store entity mappings in Redis Hash
   * Performs chunked writes to handle large datasets efficiently
   * Updates existing mappings if they already exist
   *
   * @param jobId - Import job ID
   * @param entityType - Type of entity (e.g., 'users', 'labels', 'issues')
   * @param mappings - Array of external_id -> plane_id mappings
   *
   * @example
   * await storageService.put('job-123', 'users', [
   *   { externalId: 'jira_user_1', planeId: 'plane_uuid_1' },
   *   { externalId: 'jira_user_2', planeId: 'plane_uuid_2' }
   * ]);
   */
  async storeMapping(
    jobId: string,
    entityType: string,
    mappings: Array<{ externalId: string; planeId: string }>
  ): Promise<void> {
    if (mappings.length === 0) return;

    const hashKey = this.getMappingKey(jobId, entityType);

    // Store in chunks to avoid large operations
    for (let i = 0; i < mappings.length; i += this.CHUNK_SIZE) {
      const chunk = mappings.slice(i, i + this.CHUNK_SIZE);
      const chunkMap = new Map(chunk.map((m) => [m.externalId, m.planeId]));

      // NX=false means update existing keys
      await this.store.setMap(hashKey, chunkMap, this.TTL_SECONDS, false);
    }
  }

  /**
   * Append and merge array data into Redis Hash
   * Hash automatically deduplicates - same key = overwrite (which is what we want)
   *
   * @param jobId - Import job ID
   * @param stepName - Name of the step storing the data
   * @param data - Array of data to merge in
   * @param deduplicateBy - Key field to use as Hash key (e.g., 'external_id')
   */
  async storeData<T>(jobId: string, stepName: string, data: T[], deduplicateBy: string[]): Promise<void> {
    if (data.length === 0) return;

    const hashKey = this.getDataKey(jobId, stepName);

    // Build map for this batch
    const itemMap = new Map<string, string>();
    for (const item of data) {
      const keyParts: string[] = [];
      let hasInvalidKeyPart = false;
      for (const field of deduplicateBy) {
        let value: unknown;
        if (field.toString().includes(".")) {
          value = field
            .toString()
            .split(".")
            .reduce((obj: any, chunk: string) => obj?.[chunk], item as any);
        } else {
          value = (item as any)[field as keyof T];
        }
        if (value === undefined || value === null || value === "") {
          hasInvalidKeyPart = true;
          break;
        }
        keyParts.push(String(value));
      }

      if (hasInvalidKeyPart || keyParts.length === 0) {
        logger.warn(`Skipping item with invalid deduplication key: ${JSON.stringify(item)}`, {
          jobId,
          stepName,
          deduplicateBy,
        });
        continue;
      }
      const key = keyParts.join(":");
      itemMap.set(key, JSON.stringify(item));
    }

    // MERGE into existing Hash (doesn't replace entire Hash, just adds/updates fields)
    await this.store.setMap(hashKey, itemMap, this.TTL_SECONDS, false);
  }

  /**
   * Retrieve shared data from a dependency step
   * Data is deserialized from JSON
   *
   * @param jobId - Import job ID
   * @param stepName - Name of the step that stored the data
   * @returns The retrieved data, or null if not found
   *
   * @example
   * const boardData = await storageService.retrieveData<{ boards: Board[] }>('job-123', 'boards');
   * if (boardData) {
   *   console.log(`Found ${boardData.boards.length} boards`);
   * }
   */
  async retrieveData<T>(jobId: string, stepName: string): Promise<T | null> {
    const hashKey = this.getDataKey(jobId, stepName);

    // Get ALL fields from Hash
    const allData = await this.store.getMap(hashKey);
    if (!allData) return null;

    const items = Array.from(allData.values()).map((str) => JSON.parse(str));

    return items as T;
  }

  /**
   * Generate Redis key for shared data
   *
   * @param jobId - Import job ID
   * @param stepName - Name of the step
   * @returns Redis key in format: job:{jobId}:data:{stepName}
   *
   * @private
   */
  private getDataKey(jobId: string, stepName: string): string {
    return `job:${jobId}:data:${stepName}`;
  }

  /**
   * Generate Redis hash key for entity mappings
   *
   * @param jobId - Import job ID
   * @param entityType - Type of entity
   * @returns Redis key in format: job:{jobId}:mappings:{entityType}
   *
   * @private
   */
  private getMappingKey(jobId: string, entityType: string): string {
    return `job:${jobId}:mappings:${entityType}`;
  }
}

export const redisStorageService = new RedisStorageService();
