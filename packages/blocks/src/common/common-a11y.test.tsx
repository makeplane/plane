/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColorPicker } from "./color-picker/color-picker";
import { DragHandle } from "./drag-handle";
import { FavoriteStar } from "./favorite-star";

describe("FavoriteStar", () => {
  it("is a named toggle that reflects the selected state", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<FavoriteStar selected={false} onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Add to favorites" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<FavoriteStar selected onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Add to favorites" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("takes the accessible name from the caller when given", () => {
    render(<FavoriteStar selected={false} onClick={vi.fn()} aria-label="Star cycle" />);
    expect(screen.getByRole("button", { name: "Star cycle" })).toBeDefined();
  });
});

describe("DragHandle", () => {
  it("names the icon-only handle and hides its glyph", () => {
    render(<DragHandle />);
    const button = screen.getByRole("button", { name: "Drag to rearrange" });
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("takes the accessible name from the caller when given", () => {
    render(<DragHandle aria-label="Reorder widget" />);
    expect(screen.getByRole("button", { name: "Reorder widget" })).toBeDefined();
  });

  it("renders no button when disabled", () => {
    render(<DragHandle disabled />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("ColorPicker", () => {
  it("renders a named non-submit trigger", () => {
    render(<ColorPicker value="#000000" onChange={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Open color picker" });
    expect(trigger.getAttribute("type")).toBe("button");
  });
});
