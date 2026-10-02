/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { clampWidth, PANEL_MAX_WIDTH, PANEL_MIN_WIDTH } from "@/components/ai-copilot/panel";
import { CopilotStore } from "@/store/copilot.store";

describe("clampWidth", () => {
  it("clamps below the minimum", () => {
    expect(clampWidth(0)).toBe(PANEL_MIN_WIDTH);
    expect(clampWidth(100)).toBe(PANEL_MIN_WIDTH);
  });

  it("clamps above the maximum", () => {
    expect(clampWidth(10000)).toBe(PANEL_MAX_WIDTH);
  });

  it("keeps a width inside the range", () => {
    expect(clampWidth(400)).toBe(400);
    expect(clampWidth(PANEL_MIN_WIDTH)).toBe(PANEL_MIN_WIDTH);
    expect(clampWidth(PANEL_MAX_WIDTH)).toBe(PANEL_MAX_WIDTH);
  });
});

describe("panel toggle via the store", () => {
  it("togglePanel opens and closes the panel", () => {
    const store = new CopilotStore();
    expect(store.panelOpen).toBe(false);

    store.togglePanel();
    expect(store.panelOpen).toBe(true);

    store.togglePanel();
    expect(store.panelOpen).toBe(false);

    store.togglePanel(true);
    expect(store.panelOpen).toBe(true);
  });
});
