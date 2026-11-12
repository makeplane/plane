/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModuleSelect } from "./module-select";

const modules = [
  { id: "core", name: "Core workflow" },
  { id: "onboarding", name: "Onboarding flow" },
];

const renderMulti = (variant: "select-ghost-md" | "table-cell") =>
  render(
    <ModuleSelect
      multiple
      getValues={() => Promise.resolve({ results: [] })}
      value={modules}
      onChange={vi.fn()}
      variant={variant}
    />
  );

describe("ModuleSelect multi-select pills", () => {
  it("lists each selected module as a 24px badge, matching the label pills", () => {
    renderMulti("select-ghost-md");
    for (const module of modules) {
      const pill = screen.getByText(module.name).closest('[data-slot="module-pill"]');
      if (!(pill instanceof HTMLElement)) throw new Error("module pill not rendered");
      expect(pill.tagName).toBe("SPAN");
      expect(pill.className).toContain("h-(--control-height-sm)");
      expect(pill.className).toContain("bg-layer-3");
      expect(pill.querySelector("svg")).not.toBeNull();
    }
  });

  it("summarises the selection as a count in a table cell", () => {
    renderMulti("table-cell");
    expect(screen.getByText("2 modules")).toBeTruthy();
    expect(document.querySelector('[data-slot="module-pill"]')).toBeNull();
  });
});
