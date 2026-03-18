/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Calculate date N working days ago (Mon-Fri).
 * Returns YYYY-MM-DD string.
 */
export const getMinAllowedDate = (workingDays = 60): string => {
  const d = new Date();
  let counted = 0;
  while (counted < workingDays) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) counted++;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Check if a worklog logged_at date is within the editable window (60 working days).
 */
export const isWithinEditWindow = (loggedAt: string, workingDays = 60): boolean => {
  const minDate = getMinAllowedDate(workingDays);
  return loggedAt >= minDate; // string comparison works for YYYY-MM-DD
};
