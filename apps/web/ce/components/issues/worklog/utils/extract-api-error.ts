/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Extract a human-readable error message from API error responses.
 * Handles both view-level {"error": "message"} and DRF serializer {"field": ["message"]} formats.
 *
 * NOTE: WorklogService .catch blocks already unwrap error.response.data before throwing,
 * so `err` here is the raw data object — not an AxiosError wrapper.
 */
export function extractApiError(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const data = err as Record<string, unknown>;

  // View-level: {"error": "message"}
  if (typeof data.error === "string") return data.error;

  // DRF serializer: {"field_name": ["message1", ...]} or {"non_field_errors": [...]}
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return value[0];
    }
  }
  return undefined;
}
