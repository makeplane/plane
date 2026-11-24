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

  it("is keyboard focusable and activates without submitting its form", async () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <FavoriteStar selected={false} onClick={onClick} />
      </form>
    );
    const button = screen.getByRole("button", { name: "Add to favorites" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.querySelector("button, a, input, select, textarea, [tabindex]")).toBeNull();

    const user = userEvent.setup();
    await user.tab();
    expect(document.activeElement).toBe(button);
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("passes the native button event through so the caller can prevent parent actions", async () => {
    const onParentClick = vi.fn();
    let clickedButton: HTMLButtonElement | undefined;
    const onClick = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => {
      clickedButton = event.currentTarget;
      event.preventDefault();
      event.stopPropagation();
      expect(event.defaultPrevented).toBe(true);
      expect(event.isPropagationStopped()).toBe(true);
    });
    render(
      <div role="presentation" onClick={onParentClick}>
        <FavoriteStar selected={false} onClick={onClick} />
      </div>
    );
    const button = screen.getByRole("button", { name: "Add to favorites" });
    await userEvent.click(button);
    expect(clickedButton).toBe(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("preserves caller button and decorative icon classes across selection changes", () => {
    const props = {
      buttonClassName: "h-6 w-6 bg-white/10 rounded-sm",
      iconClassName: "h-3 w-3 text-on-color",
      onClick: vi.fn(),
    };
    const { rerender } = render(<FavoriteStar {...props} selected={false} />);
    for (const selected of [false, true]) {
      rerender(<FavoriteStar {...props} selected={selected} />);
      const button = screen.getByRole("button", { name: "Add to favorites" });
      expect(button.getAttribute("aria-pressed")).toBe(String(selected));
      for (const className of props.buttonClassName.split(" ")) {
        expect(button.classList.contains(className)).toBe(true);
      }
      const icons = button.querySelectorAll("svg");
      expect(icons).toHaveLength(2);
      for (const icon of icons) {
        expect(icon.getAttribute("aria-hidden")).toBe("true");
        for (const className of props.iconClassName.split(" ")) {
          expect(icon.classList.contains(className)).toBe(true);
        }
      }
    }
  });

  it("defaults to the compact ghost button and takes caller size and variant", () => {
    const { rerender } = render(<FavoriteStar selected={false} onClick={vi.fn()} />);
    const ghostClasses = screen.getByRole("button", { name: "Add to favorites" }).className;
    expect(ghostClasses).toContain("size-(--control-height-sm)");

    rerender(<FavoriteStar selected={false} onClick={vi.fn()} size="md" variant="secondary" />);
    const secondaryClasses = screen.getByRole("button", { name: "Add to favorites" }).className;
    expect(secondaryClasses).toContain("size-(--control-height-md)");
    expect(secondaryClasses).not.toBe(ghostClasses.replace("size-(--control-height-sm)", "size-(--control-height-md)"));
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
