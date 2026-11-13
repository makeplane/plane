/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// jsdom runs no layout and implements neither observer API; this file patches in what the
// component tests need, mirroring packages/blocks/vitest.setup.dom.ts.
/* oxlint-disable no-extend-native */

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

/**
 * jsdom implements neither observer API. Base UI's floating positioning needs a `ResizeObserver`
 * that merely exists, while select popups' paging sentinels need an `IntersectionObserver` that
 * actually reports the sentinel as visible — so this one fires once per `observe()` with
 * `isIntersecting: true`, which is exactly the "user scrolled to the bottom" signal.
 */
class TestResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class TestIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: readonly number[] = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element): void {
    const entry = { isIntersecting: true, target } as IntersectionObserverEntry;
    this.callback([entry], this);
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeEach(() => {
  globalThis.ResizeObserver ??= TestResizeObserver;
  globalThis.IntersectionObserver ??= TestIntersectionObserver;
});

afterEach(() => {
  cleanup();
});
