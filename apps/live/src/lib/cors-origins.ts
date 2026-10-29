/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Parses the CORS_ALLOWED_ORIGINS environment value into a list of origins.
 *
 * `"".split(",")` yields `[""]` rather than `[]`, so parsing inline left the
 * caller with a one-element list of an empty string whenever the variable was
 * unset. Empty entries are dropped here so an unset or comma-padded value
 * produces an empty list and the caller can fall back to denying every origin.
 *
 * @param raw The raw CORS_ALLOWED_ORIGINS value.
 * @returns The configured origins, without empty entries.
 */
export function parseAllowedOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
