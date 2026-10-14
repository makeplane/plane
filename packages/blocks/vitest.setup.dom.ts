/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// jsdom runs no layout and leaves scrolling unimplemented; patching its prototypes is this file's purpose.
/* oxlint-disable no-extend-native */

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

/**
 * jsdom implements neither observer API. Base UI's floating positioning needs a `ResizeObserver`
 * that merely exists, while the Select's paging sentinel needs an `IntersectionObserver` that
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

/** The viewport height every stubbed box reports. Matches the Select popup's own scroller cap. */
const VIEWPORT_HEIGHT = 240;

/**
 * The tallest pixel height declared inline anywhere under `element`. jsdom lays nothing out, so
 * this stands in for content height — and it is not a fiction: the virtualizer sizes its spacer
 * with an explicit `style.height`, which is exactly what a browser would measure.
 */
function declaredContentHeight(element: Element): number {
  let tallest = 0;
  for (const node of element.querySelectorAll<HTMLElement>("[style]")) {
    const height = Number.parseFloat(node.style.height);
    if (Number.isFinite(height)) tallest = Math.max(tallest, height);
  }
  return tallest;
}

/**
 * jsdom runs no layout, so every box reports zero. A virtualized list whose scroller measures 0
 * high renders nothing at all, and `@tanstack/react-virtual` clamps every `scrollToIndex` to zero
 * because `scrollHeight - clientHeight` is zero — which would make both the window and the
 * keyboard-navigation assertions vacuous. Give elements a viewport-sized box and a content height
 * read off the virtualizer's own spacer.
 */
function stubLayoutBox() {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => VIEWPORT_HEIGHT });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 256 });
  Object.defineProperty(Element.prototype, "clientHeight", { configurable: true, get: () => VIEWPORT_HEIGHT });
  Object.defineProperty(Element.prototype, "scrollHeight", {
    configurable: true,
    get(this: Element) {
      return Math.max(declaredContentHeight(this), VIEWPORT_HEIGHT);
    },
  });
}

/**
 * jsdom pins `scrollTop` to 0 and leaves `Element.scrollTo` unimplemented, so a virtualizer can
 * never page past its first window — which is exactly what the keyboard-navigation tests exercise.
 * Back the offset with real storage and emit the `scroll` event `@tanstack/react-virtual` listens
 * for, so `scrollToIndex` moves the rendered window the way it would in a browser.
 */
function stubScrolling() {
  const offsets = new WeakMap<Element, number>();
  // Delayed scroll-lock cleanup can outlive jsdom teardown. Keep this DOM's constructor
  // rather than reading the host Event global that Vitest restores during teardown.
  const ScrollEvent = window.Event;
  Object.defineProperty(Element.prototype, "scrollTop", {
    configurable: true,
    get(this: Element) {
      return offsets.get(this) ?? 0;
    },
    set(this: Element, next: number) {
      offsets.set(this, Math.max(0, next));
      this.dispatchEvent(new ScrollEvent("scroll"));
    },
  });
  Object.defineProperty(Element.prototype, "scrollTo", {
    configurable: true,
    writable: true,
    value(this: Element, options?: number | ScrollToOptions, y?: number) {
      const top = typeof options === "number" ? y : options?.top;
      if (typeof top === "number") this.scrollTop = top;
    },
  });
}

/** Defines `Element.prototype[name]` only when jsdom has left it unimplemented. */
function stubElementMethod(name: string, value: () => unknown) {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  if (typeof proto[name] === "function") return;
  proto[name] = value;
}

beforeEach(() => {
  globalThis.ResizeObserver ??= TestResizeObserver;
  globalThis.IntersectionObserver ??= TestIntersectionObserver;
  stubLayoutBox();
  stubScrolling();
  // Pointer capture and scroll-into-view are unimplemented in jsdom; Base UI's popup and
  // user-event's pointer sequences both call them.
  stubElementMethod("hasPointerCapture", () => false);
  stubElementMethod("setPointerCapture", () => undefined);
  stubElementMethod("releasePointerCapture", () => undefined);
  stubElementMethod("scrollIntoView", () => undefined);
  // Base UI's ScrollArea waits on the viewport's running animations before measuring.
  stubElementMethod("getAnimations", () => []);
});

afterEach(() => {
  cleanup();
});
