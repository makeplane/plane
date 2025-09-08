/**
 * Centralized key management for Notion importer
 * This ensures consistent key formatting and naming across the application
 */

import { ENotionImporterKeyType } from "../types";

// Key prefixes
const KEY_PREFIX = "SILO_NOTION_IMPORTER";

/**
 * Creates consistent cache keys for Notion importer
 * @param type The type of key from KeyType enum
 * @param id Primary identifier (usually fileId)
 * @param subId Optional secondary identifier (like pageId, assetId, etc.)
 */
export const getKey = (jobId: string, fileId: string, type: ENotionImporterKeyType): string => `${KEY_PREFIX}_${jobId}_${type}_${fileId}`;
