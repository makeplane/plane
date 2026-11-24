/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: pure helpers of the activity heatmap (rows = days, columns = quarters of the day).

import type { TActivityBucket } from "./types";

export const SLOTS_PER_DAY = 96;
export const LEVELS = 5; // 0 = no activity, 1-4 = quartiles of the non-empty quarters

/** Shifts a YYYY-MM-DD date by whole days. */
export const shiftDate = (date: string, days: number): string => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

/** Local dates from `from` to `to` (YYYY-MM-DD, inclusive), newest first. */
export const daysInRange = (from: string, to: string): string[] => {
  const count = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, index) => shiftDate(to, -index));
};

export const bucketKey = (date: string, slot: number) => `${date}#${slot}`;

export const indexBuckets = (buckets: TActivityBucket[]): Map<string, TActivityBucket> =>
  new Map(buckets.map((bucket) => [bucketKey(bucket.date, bucket.slot), bucket]));

/**
 * Upper bounds of levels 1-3 (level 4 is everything above), from the quartiles of the non-empty counts, so
 * a quiet project still shows contrast and a single busy quarter does not flatten the rest.
 */
export const levelThresholds = (counts: number[]): [number, number, number] => {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts the fresh copy made by filter
  const sorted = counts.filter((count) => count > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [1, 1, 1];
  const quantile = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return [quantile(0.25), quantile(0.5), quantile(0.75)];
};

export const levelOf = (count: number, thresholds: [number, number, number]): number => {
  if (count <= 0) return 0;
  if (count <= thresholds[0]) return 1;
  if (count <= thresholds[1]) return 2;
  if (count <= thresholds[2]) return 3;
  return 4;
};

const pad = (value: number) => value.toString().padStart(2, "0");

/** "14:15" for slot 57. */
export const slotTime = (slot: number): string => `${pad(Math.floor(slot / 4))}:${pad((slot % 4) * 15)}`;

/** "14:15–14:30" for slot 57. */
export const slotRange = (slot: number): string =>
  `${slotTime(slot)}–${slot === SLOTS_PER_DAY - 1 ? "24:00" : slotTime(slot + 1)}`;

/** Start and end of a quarter as ISO date-times without offset; the API reads them in the given time zone. */
export const slotBounds = (date: string, slot: number): { start: string; end: string } => {
  const end = slot === SLOTS_PER_DAY - 1 ? `${shiftDate(date, 1)}T00:00:00` : `${date}T${slotTime(slot + 1)}:00`;
  return { start: `${date}T${slotTime(slot)}:00`, end };
};

/** Minutes covered by time ranges (epoch ms, [start, end)); time where ranges overlap counts once. */
export const coveredMinutes = (ranges: [number, number][]): number => {
  let total = 0;
  let coveredUntil = -Infinity;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts the fresh copy made by filter; empty ranges add nothing
  const sorted = ranges.filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]);
  for (const [start, end] of sorted) {
    if (end <= coveredUntil) continue;
    total += end - Math.max(start, coveredUntil);
    coveredUntil = end;
  }
  return total / 60_000;
};

export type TQuarter = { date: string; slot: number };

const QUARTER_MS = 15 * 60_000;

/** Local date (YYYY-MM-DD) and quarter of the day (0-95) of a moment in a time zone. */
export const currentQuarter = (timeZone: string, now: Date = new Date()): TQuarter => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone,
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    slot: Number(parts.hour) * 4 + Math.floor(Number(parts.minute) / 15),
  };
};

/** Milliseconds until the next quarter starts; time zone offsets are whole quarters, so this holds in any zone. */
export const msToNextQuarter = (now: number = Date.now()): number => QUARTER_MS - (now % QUARTER_MS);
