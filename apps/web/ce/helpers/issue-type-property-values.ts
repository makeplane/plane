/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Normalizes custom property values before sending them to the API.
 */
export function normalizeIssuePropertyValueForApi(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return value;
}

export function normalizeIssuePropertyValuesForApi(
  values: Record<string, unknown>
): { property_id: string; value: unknown }[] {
  return Object.entries(values).map(([property_id, value]) => ({
    property_id,
    value: normalizeIssuePropertyValueForApi(value),
  }));
}
