/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Relative date tokens for date/datetime custom fields.
 *
 * A field's `settings.min`, `settings.max` and `default_value` may hold either a
 * fixed calendar date (`2026-07-21`, `2026-07-21T09:00`) or a token that is
 * resolved against "now" every time the field is rendered, so a constraint like
 * "no later than 30 days from today" keeps meaning that as time passes.
 *
 * Token grammar: `today`, `today+<n><unit>`, `today-<n><unit>` where unit is one
 * of d (days), w (weeks), m (months), y (years). Anything that doesn't match is
 * treated as a fixed value and passed through untouched, which keeps every field
 * configured before this feature working exactly as before.
 */

import { ECustomFieldType } from "@plane/types";
import type { TCustomFieldRawValue } from "@plane/types";

export type TRelativeDateUnit = "d" | "w" | "m" | "y";

export const RELATIVE_DATE_UNITS: TRelativeDateUnit[] = ["d", "w", "m", "y"];

export type TRelativeDateParts = {
  /** Signed offset; 0 means "today". */
  offset: number;
  unit: TRelativeDateUnit;
};

const RELATIVE_DATE_RE = /^today(?:\s*([+-])\s*(\d+)\s*([dwmy]))?$/i;

/** True when the stored value is a relative token rather than a fixed date. */
export const isRelativeDate = (value: unknown): value is string =>
  typeof value === "string" && RELATIVE_DATE_RE.test(value.trim());

/** Parse a token into its parts. Returns null when the value is not a token. */
export const parseRelativeDate = (value: unknown): TRelativeDateParts | null => {
  if (typeof value !== "string") return null;
  const match = RELATIVE_DATE_RE.exec(value.trim());
  if (!match) return null;
  const [, sign, amount, unit] = match;
  // bare "today"
  if (!amount || !unit) return { offset: 0, unit: "d" };
  const magnitude = Number(amount);
  if (!Number.isFinite(magnitude)) return { offset: 0, unit: "d" };
  return {
    offset: sign === "-" ? -magnitude : magnitude,
    unit: unit.toLowerCase() as TRelativeDateUnit,
  };
};

/** Build a token from its parts. An offset of 0 collapses to plain `today`. */
export const buildRelativeDate = (parts: TRelativeDateParts): string => {
  const { offset, unit } = parts;
  if (!offset) return "today";
  return `today${offset > 0 ? "+" : "-"}${Math.abs(offset)}${unit}`;
};

/** Apply a relative offset to a date, mutating nothing. */
const shift = (base: Date, { offset, unit }: TRelativeDateParts): Date => {
  const next = new Date(base.getTime());
  switch (unit) {
    case "d":
      next.setDate(next.getDate() + offset);
      break;
    case "w":
      next.setDate(next.getDate() + offset * 7);
      break;
    case "m":
      next.setMonth(next.getMonth() + offset);
      break;
    case "y":
      next.setFullYear(next.getFullYear() + offset);
      break;
  }
  return next;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time `YYYY-MM-DD`; never use toISOString here, it would shift the day in non-UTC zones. */
const toDateInputValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Local-time `YYYY-MM-DDTHH:mm`, the format a `datetime-local` input expects. */
const toDateTimeInputValue = (date: Date) =>
  `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

/**
 * Resolve a possibly-relative value into what the native input expects.
 * Fixed values and unparseable input are returned unchanged.
 */
export const resolveDateSetting = (
  value: unknown,
  variant: "date" | "datetime" = "date",
  now: Date = new Date()
): string | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parts = parseRelativeDate(value);
  if (!parts) return typeof value === "string" ? value : undefined;
  const resolved = shift(now, parts);
  return variant === "datetime" ? toDateTimeInputValue(resolved) : toDateInputValue(resolved);
};

/**
 * Resolve a field's stored default so a relative default seeds the concrete date
 * the user sees. Non-date fields and fixed defaults are returned unchanged.
 */
export const resolveDefaultValue = (
  fieldType: ECustomFieldType,
  defaultValue: TCustomFieldRawValue
): TCustomFieldRawValue => {
  if (fieldType !== ECustomFieldType.DATE && fieldType !== ECustomFieldType.DATETIME) return defaultValue;
  if (!isRelativeDate(defaultValue)) return defaultValue;
  return resolveDateSetting(defaultValue, fieldType === ECustomFieldType.DATETIME ? "datetime" : "date") ?? null;
};
