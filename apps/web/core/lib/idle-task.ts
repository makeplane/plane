/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type IdleTaskHandle = {
  cancel: () => void;
};

const requestIdleFallback = (callback: IdleRequestCallback): number => {
  const start = Date.now();

  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, 1);
};

const cancelIdleFallback = (id: number) => {
  window.clearTimeout(id);
};

export const requestIdle = (callback: IdleRequestCallback, options?: IdleRequestOptions): number => {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function")
    return window.requestIdleCallback(callback, options);

  return requestIdleFallback(callback);
};

export const cancelIdle = (id: number) => {
  if (typeof window !== "undefined" && typeof window.cancelIdleCallback === "function")
    return window.cancelIdleCallback(id);

  return cancelIdleFallback(id);
};

export const installIdleCallbackPolyfill = () => {
  if (typeof window === "undefined") return;

  window.requestIdleCallback = window.requestIdleCallback ?? requestIdleFallback;
  window.cancelIdleCallback = window.cancelIdleCallback ?? cancelIdleFallback;
};

/**
 * Schedule lightweight work for idle time and return a cancel handle.
 * Falls back to setTimeout when requestIdleCallback is unavailable.
 */
export const runIdleTask = (callback: IdleRequestCallback): IdleTaskHandle => {
  const idleId = requestIdle(callback, { timeout: 300 });
  return {
    cancel: () => cancelIdle(idleId),
  };
};
