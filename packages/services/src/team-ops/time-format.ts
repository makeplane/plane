/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** A single entry (or a running timer) never covers more than a day; the API enforces the same limit. */
export const MAX_ENTRY_SECONDS = 24 * 60 * 60;

const pad = (value: number) => String(value).padStart(2, "0");

export const splitDuration = (totalSeconds: number): { hours: number; minutes: number } => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return { hours: Math.floor(safe / 3600), minutes: Math.floor((safe % 3600) / 60) };
};

/**
 * Turns the hours/minutes a user typed into seconds.
 * Returns `null` for anything that cannot be logged: non-integers, negatives, zero, or more than a day.
 */
export const toDurationSeconds = (hours: number, minutes: number): number | null => {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0) return null;
  const total = hours * 3600 + minutes * 60;
  if (total <= 0 || total > MAX_ENTRY_SECONDS) return null;
  return total;
};

/** `HH:MM:SS` for a running timer. */
export const formatClock = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(safe / 3600))}:${pad(Math.floor((safe % 3600) / 60))}:${pad(safe % 60)}`;
};

const unit = (value: number, name: "hour" | "minute" | "second", locale?: string) =>
  new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "narrow" }).format(value);

/** Compact, locale-aware duration such as `2h 30m`, `45m` or `30s`. */
export const formatDuration = (totalSeconds: number, locale?: string): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  if (safe < 60) return unit(safe, "second", locale);
  const { hours, minutes } = splitDuration(safe);
  const parts: string[] = [];
  if (hours > 0) parts.push(unit(hours, "hour", locale));
  if (minutes > 0) parts.push(unit(minutes, "minute", locale));
  return parts.join(" ");
};

/** Local calendar day as `YYYY-MM-DD`, the format the API takes for whole-day ranges. */
export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * The seven local days containing `reference`, as inclusive `from`/`to` date keys.
 * `weekStartsOn` follows `Date#getDay` (0 = Sunday, 1 = Monday, 6 = Saturday).
 */
export const getWeekRange = (reference: Date, weekStartsOn: number = 1): { from: string; to: string } => {
  const offset = (reference.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - offset);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { from: toDateKey(start), to: toDateKey(end) };
};

/** Moves a reference date by whole weeks (negative goes back). */
export const shiftWeeks = (reference: Date, weeks: number): Date =>
  new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + weeks * 7);
