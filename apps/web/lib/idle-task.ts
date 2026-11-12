/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type IdleTaskHandle = {
  cancel: () => void;
};

const requestIdleFallback = (callback: IdleRequestCallback, options?: IdleRequestOptions): number => {
  const start = Date.now();

  return globalThis.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, options?.timeout ?? 1) as unknown as number;
};

const cancelIdleFallback = (id: number) => {
  globalThis.clearTimeout(id);
};

export const requestIdle = (callback: IdleRequestCallback, options?: IdleRequestOptions): number => {
  if (typeof globalThis.requestIdleCallback === "function") return globalThis.requestIdleCallback(callback, options);

  return requestIdleFallback(callback, options);
};

export const cancelIdle = (id: number) => {
  if (typeof globalThis.cancelIdleCallback === "function") return globalThis.cancelIdleCallback(id);

  return cancelIdleFallback(id);
};

export const installIdleCallbackPolyfill = () => {
  if (typeof globalThis === "undefined") return;

  globalThis.requestIdleCallback = globalThis.requestIdleCallback ?? requestIdleFallback;
  globalThis.cancelIdleCallback = globalThis.cancelIdleCallback ?? cancelIdleFallback;
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
