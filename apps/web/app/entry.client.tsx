/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// Safari / iOS WebKit still lack requestIdleCallback; Plane layout loaders call it.
function requestIdleCallbackPolyfill(callback: IdleRequestCallback, options?: IdleRequestOptions): number {
  const start = Date.now();
  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start));
      },
    });
  }, options?.timeout ?? 1);
}

function cancelIdleCallbackPolyfill(id: number) {
  clearTimeout(id);
}

if (typeof window !== "undefined" && typeof window.requestIdleCallback !== "function") {
  window.requestIdleCallback = requestIdleCallbackPolyfill;
}

if (typeof window !== "undefined" && typeof window.cancelIdleCallback !== "function") {
  window.cancelIdleCallback = cancelIdleCallbackPolyfill;
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
