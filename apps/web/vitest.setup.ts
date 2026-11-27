/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

/* oxlint-disable no-extend-native */
class TestResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  globalThis.ResizeObserver ??= TestResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(() => {
  cleanup();
});
