/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabelPill } from "./label-pill";

const label = { name: "Customer bug", color: "#ef4444" };

const getPill = () => {
  const pill = screen.getByText(label.name).closest('[data-slot="label-pill"]');
  if (!(pill instanceof HTMLElement)) throw new Error("label pill not rendered");
  return pill;
};

describe("LabelPill", () => {
  it("renders a display-only span, not a button", () => {
    render(<LabelPill label={label} />);
    const pill = getPill();
    expect(pill.tagName).toBe("SPAN");
    expect(pill.hasAttribute("type")).toBe(false);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the label colour as a decorative swatch before the name", () => {
    render(<LabelPill label={label} />);
    const swatch = getPill().firstElementChild as HTMLElement;
    expect(swatch.getAttribute("aria-hidden")).toBe("true");
    expect(swatch.style.getPropertyValue("--swatch-fill")).toBe(label.color);
  });

  it("falls back to the text colour for a label without one", () => {
    render(<LabelPill label={{ name: "Unloaded", color: "" }} />);
    const pill = screen.getByText("Unloaded").closest('[data-slot="label-pill"]') as HTMLElement;
    const swatch = pill.firstElementChild as HTMLElement;
    expect(swatch.style.getPropertyValue("--swatch-fill")).toBe("currentColor");
  });

  it("is soft by default and outline on request", () => {
    const { rerender } = render(<LabelPill label={label} />);
    expect(getPill().className).toContain("bg-layer-3");
    rerender(<LabelPill label={label} variant="outline" />);
    expect(getPill().className).toContain("border-subtle-1");
    expect(getPill().className).not.toContain("bg-layer-3");
  });

  it("caps its width at the pill maximum or its container, whichever is smaller", () => {
    render(<LabelPill label={label} className="ml-1" />);
    const pill = getPill();
    expect(pill.className).toContain("max-w-[min(224px,100%)]");
    expect(pill.className).not.toContain("max-w-[224px]");
    expect(pill.className).toContain("ml-1");
  });

  it("uses the 24px pill size", () => {
    render(<LabelPill label={label} />);
    expect(getPill().className).toContain("h-(--control-height-sm)");
  });
});
