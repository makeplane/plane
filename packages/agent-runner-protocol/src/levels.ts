/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Permission levels, which our adapters expose as ACP session mode ids. Ordered least to most
 * permissive, matching `AGENT_PERMISSION_LEVEL_ORDER` in the API and `PERMISSION_MODE_IDS` in
 * `@plane/acp-adapters`. Never reorder: the rank is what the admin maximum is enforced against.
 */
export const PERMISSION_LEVELS = ["ask_all", "ask_writes", "yolo"] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

/** `_meta` key on `session/new|load|resume` that picks the starting mode. */
export const INITIAL_MODE_META_KEY = "plane/initialModeId";

export function isPermissionLevel(value: unknown): value is PermissionLevel {
  return typeof value === "string" && (PERMISSION_LEVELS as readonly string[]).includes(value);
}

export function permissionRank(level: PermissionLevel): number {
  return PERMISSION_LEVELS.indexOf(level);
}

/** The less permissive of `requested` and `max`. */
export function clampPermissionLevel(requested: PermissionLevel, max: PermissionLevel): PermissionLevel {
  return permissionRank(requested) <= permissionRank(max) ? requested : max;
}
