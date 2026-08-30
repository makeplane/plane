/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Formats a countdown in seconds as a "MM:SS" label.
 * @example formatCountdown(1505) // "25:05"
 * @example formatCountdown(0) // "00:00"
 */
export const formatCountdown = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
};
