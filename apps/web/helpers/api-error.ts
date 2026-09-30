/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type ApiErrorLike =
  | string
  | {
      error?: unknown;
      detail?: unknown;
      message?: unknown;
      payload?: unknown;
      non_field_errors?: unknown;
    }
  | null
  | undefined;

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    for (const key of ["error", "detail", "message", "payload", "non_field_errors"]) {
      const found = firstString((value as Record<string, unknown>)[key]);
      if (found) return found;
    }
    for (const v of Object.values(value as Record<string, unknown>)) {
      const found = firstString(v);
      if (found) return found;
    }
  }
  return undefined;
}

export function getApiErrorMessage(error: ApiErrorLike, fallback: string): string {
  const msg = firstString(error);
  return msg?.trim() ? msg : fallback;
}
