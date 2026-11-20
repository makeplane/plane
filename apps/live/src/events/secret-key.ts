/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Known example or placeholder values (the shipped default and the .env.example files), never accepted.
const KNOWN_WEAK_KEYS = new Set(["change-this-key-on-deployment", "secret-key"]);
export const MIN_KEY_LENGTH = 32;

/** True when the live shared secret is set, long enough and not a known example value. */
export const isUsableKey = (key: string | undefined): key is string =>
  typeof key === "string" && key.length >= MIN_KEY_LENGTH && !KNOWN_WEAK_KEYS.has(key);
