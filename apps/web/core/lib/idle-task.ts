/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type IdleTaskHandle = {
  cancel: () => void;
};

/**
 * Schedule lightweight work for idle time and return a cancel handle.
 * Falls back to setTimeout when requestIdleCallback is unavailable.
 */
export const runIdleTask = (callback: () => void): IdleTaskHandle => {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(callback, { timeout: 300 });
    return {
      cancel: () => window.cancelIdleCallback(idleId),
    };
  }

  const timeoutId = window.setTimeout(callback, 0);
  return {
    cancel: () => window.clearTimeout(timeoutId),
  };
};
