/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Ensures `window.requestIdleCallback` and `window.cancelIdleCallback` exist.
 * Installs minimal shims when the browser omits them (e.g. older Safari / WebKit).
 * Safe to call repeatedly; only assigns missing APIs once.
 */
function ensureRequestIdleCallbackPolyfilled(): void {
  if (typeof window === "undefined" || !window) {
    return;
  }

  window.requestIdleCallback =
    window.requestIdleCallback ??
    function (cb) {
      const start = Date.now();
      return setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    };

  window.cancelIdleCallback =
    window.cancelIdleCallback ??
    function (id) {
      clearTimeout(id);
    };
}

ensureRequestIdleCallbackPolyfilled();

/**
 * Schedules work to run when the browser is idle, or after a short delay when idle scheduling is unavailable.
 *
 * @param callback - Invoked with an `IdleDeadline`-like object (native or polyfilled).
 * @param options - Optional `timeout` forwarded to the native API when present.
 * @returns An idle handle for cancellation, or `0` when `window` is undefined (SSR).
 */
export function scheduleIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number {
  ensureRequestIdleCallbackPolyfilled();
  if (typeof window === "undefined") {
    return 0;
  }
  return window.requestIdleCallback(callback, options);
}
