/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// jsdom leaves these browser APIs unimplemented; Base UI (behind propel) calls them.
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

class TestResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function stubElementMethod(name: string, value: () => unknown) {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  if (typeof proto[name] !== "function") proto[name] = value;
}

beforeEach(() => {
  globalThis.ResizeObserver ??= TestResizeObserver;
  stubElementMethod("hasPointerCapture", () => false);
  stubElementMethod("setPointerCapture", () => undefined);
  stubElementMethod("releasePointerCapture", () => undefined);
  stubElementMethod("scrollIntoView", () => undefined);
  stubElementMethod("getAnimations", () => []);
});

afterEach(() => {
  cleanup();
});
