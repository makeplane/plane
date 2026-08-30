/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Formats a duration in minutes as a compact "Xh Ym" label.
 * @example formatDuration(135) // "2h 15m"
 * @example formatDuration(45)  // "45m"
 * @example formatDuration(120) // "2h"
 */
export const formatDuration = (totalMinutes: number | undefined | null): string => {
  if (!totalMinutes || totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

/** Splits a stored minute total back into the hours/minutes pair the form edits. */
export const splitDuration = (totalMinutes: number | undefined | null) => ({
  hours: totalMinutes ? Math.floor(totalMinutes / 60) : 0,
  minutes: totalMinutes ? totalMinutes % 60 : 0,
});
