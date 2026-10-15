/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// This file supplies browser methods absent from jsdom for DOM component tests.
/* oxlint-disable no-extend-native */

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom provides no layout/observer APIs. These only let overlay components mount;
// real geometry, scrolling, and focus visibility are checked in the running apps.
class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", TestResizeObserver);
if (!window.PointerEvent) {
  class TestPointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, options: PointerEventInit = {}) {
      super(type, options);
      this.pointerId = options.pointerId ?? 1;
      this.pointerType = options.pointerType ?? "mouse";
      this.isPrimary = options.isPrimary ?? true;
    }
  }
  vi.stubGlobal("PointerEvent", TestPointerEvent);
}
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }),
});

for (const name of ["scrollIntoView", "setPointerCapture", "releasePointerCapture"] as const) {
  if (!(name in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, value: () => undefined });
  }
}
if (!("hasPointerCapture" in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", { configurable: true, value: () => false });
}
if (!("getAnimations" in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
}

afterEach(() => {
  cleanup();
});
