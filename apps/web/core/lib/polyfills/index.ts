/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Installs `window.requestIdleCallback` / `cancelIdleCallback` when missing (e.g. older Safari). Idempotent. */
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

export function scheduleIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number {
  ensureRequestIdleCallbackPolyfilled();
  if (typeof window === "undefined") {
    return 0;
  }
  return window.requestIdleCallback(callback, options);
}
