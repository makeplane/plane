/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

if (typeof window !== "undefined" && window) {
  // Add request callback polyfill to browser in case it does not exist
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

// Defensive wrappers for use at call sites that may run before the side-effect
// above is applied (e.g., lazy-loaded chunks like gantt-layout-loader that can
// execute before app/provider.tsx finishes evaluating).
export const safeRequestIdleCallback: typeof window.requestIdleCallback = (cb, options) => {
  if (typeof window !== "undefined" && window.requestIdleCallback) {
    return window.requestIdleCallback(cb, options);
  }
  const start = Date.now();
  // setTimeout's return type is `number | NodeJS.Timeout` depending on the resolved
  // typings; in a browser context (the only path that reaches this fallback) it is
  // always `number`. Cast to satisfy the DOM-shaped IdleCallbackHandle return.
  return setTimeout(
    () =>
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      }),
    1
  ) as unknown as number;
};

export const safeCancelIdleCallback: typeof window.cancelIdleCallback = (id) => {
  if (typeof window !== "undefined" && window.cancelIdleCallback) {
    window.cancelIdleCallback(id);
    return;
  }
  clearTimeout(id);
};
