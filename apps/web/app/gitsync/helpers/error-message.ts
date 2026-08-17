/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function gitsyncErrorMessage(err: unknown, fallback = "error"): string {
  if (typeof err === "object" && err && err !== null && "error" in err) {
    return String((err as { error: string }).error);
  }
  if (typeof err === "object" && err && err !== null) {
    const values = Object.values(err as Record<string, unknown>);
    const first = values[0];
    if (Array.isArray(first) && first.length > 0) return String(first[0]);
    if (typeof first === "string") return first;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
