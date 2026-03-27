/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Shared time formatting utilities for timesheet and analytics tables.
 */

/** Format a duration in minutes as "Xh Ym" (e.g. "1h 30m", "45m", "2h"). */
export function formatMinutes(m: number): string {
  if (m === 0) return "0m";
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h === 0) return `${mins}m`;
  if (mins === 0) return `${h}h`;
  return `${h}h ${mins}m`;
}

/** Return array of 7 ISO date strings (Mon–Sun) starting from weekStart. */
export function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const d = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    dates.push(nd.toISOString().split("T")[0]);
  }
  return dates;
}
