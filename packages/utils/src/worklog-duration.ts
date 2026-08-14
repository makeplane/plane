/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Maximum duration accepted for a single worklog, in seconds (10,000 hours). */
export const WORKLOG_DURATION_MAX_SECONDS = 10_000 * 3600;

/**
 * Parse a human duration such as `30m`, `1h`, or `1h 30m` into seconds.
 * Rejects unit-less numbers, decimals, and other ambiguous forms.
 */
export const parseWorklogDurationInput = (raw: string): number | null => {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  if (!value) return null;

  const pattern = /^(?:(\d+)h)?(?:\s*(\d+)m)?(?:\s*(\d+)s)?$/;
  const match = value.match(pattern);
  if (!match) return null;

  const hours = match[1] ? Number.parseInt(match[1], 10) : 0;
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  const seconds = match[3] ? Number.parseInt(match[3], 10) : 0;

  if (!match[1] && !match[2] && !match[3]) return null;
  if (![hours, minutes, seconds].every((part) => Number.isFinite(part))) return null;

  const total = hours * 3600 + minutes * 60 + seconds;
  if (total < 1 || total > WORKLOG_DURATION_MAX_SECONDS) return null;
  return total;
};

/** Format canonical worklog seconds as `1h 30m`. */
export const formatWorklogDuration = (totalSeconds: number | undefined | null): string => {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0m";
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  if (parts.length === 0) return "0m";
  return parts.join(" ");
};
