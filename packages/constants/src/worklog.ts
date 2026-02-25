/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Format minutes to a human-readable display string.
 * e.g. 90 → "1h 30m", 60 → "1h", 25 → "25m", 0 → "0m"
 */
export const formatMinutesToDisplay = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Convert hours + minutes inputs to total minutes.
 */
export const parseDisplayToMinutes = (hours: number, minutes: number): number => hours * 60 + minutes;
