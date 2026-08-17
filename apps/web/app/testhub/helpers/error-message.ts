/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function testhubErrorMessage(err: unknown, fallback = "error"): string {
  if (typeof err === "object" && err && "error" in err) return String((err as { error: string }).error);
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
