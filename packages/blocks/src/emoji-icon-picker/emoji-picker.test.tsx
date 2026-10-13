/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmojiPicker } from "./emoji-picker";

vi.mock("./emoji/emoji", () => ({
  EmojiRoot: () => <div data-testid="emoji-grid">emoji grid</div>,
}));

vi.mock("./icon/icon-root", () => ({
  IconRoot: () => <div data-testid="icon-grid">icon grid</div>,
}));

// The image tab previews through `Logo`; the material-symbols font it watches never loads in jsdom.
vi.mock("use-font-face-observer", () => ({ default: () => true }));

function ControlledPicker() {
  const [isOpen, setIsOpen] = useState(false);
  return <EmojiPicker isOpen={isOpen} handleToggle={setIsOpen} onChange={vi.fn()} label={<span>Pick emoji</span>} />;
}

describe("EmojiPicker popover", () => {
  it("opens on trigger click and marks the panel as preventing outside click", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    expect(document.querySelector("[data-prevent-outside-click]")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Pick emoji" }));
    expect(await screen.findByTestId("emoji-grid")).toBeDefined();
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
  });

  it("keeps the prevent-outside panel while open and drops it when closed", () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <EmojiPicker isOpen handleToggle={handleToggle} onChange={vi.fn()} label={<span>Pick emoji</span>} />
    );
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
    rerender(
      <EmojiPicker isOpen={false} handleToggle={handleToggle} onChange={vi.fn()} label={<span>Pick emoji</span>} />
    );
    const panel = document.querySelector("[data-prevent-outside-click]");
    expect(panel == null || panel.hasAttribute("data-closed")).toBe(true);
  });
});

describe("EmojiPicker image tab", () => {
  it("is not offered unless onImageChange is passed", async () => {
    render(<EmojiPicker isOpen handleToggle={vi.fn()} onChange={vi.fn()} label={<span>Pick logo</span>} />);
    expect(await screen.findByTestId("emoji-grid")).toBeDefined();
    expect(screen.queryByRole("tab", { name: "Image" })).toBeNull();
  });

  it("opens on the image tab pre-filled with the current URL", async () => {
    render(
      <EmojiPicker
        isOpen
        handleToggle={vi.fn()}
        onChange={vi.fn()}
        onImageChange={vi.fn()}
        defaultOpen="image"
        defaultImageUrl="https://cdn.example.com/acme.png"
        label={<span>Pick logo</span>}
      />
    );
    const input = await screen.findByRole<HTMLInputElement>("textbox");
    expect(input.value).toBe("https://cdn.example.com/acme.png");
  });

  it("hands back a safe image URL and closes", async () => {
    const user = userEvent.setup();
    const onImageChange = vi.fn();
    const handleToggle = vi.fn();
    render(
      <EmojiPicker
        isOpen
        handleToggle={handleToggle}
        onChange={vi.fn()}
        onImageChange={onImageChange}
        label={<span>Pick logo</span>}
      />
    );

    await user.click(await screen.findByRole("tab", { name: "Image" }));
    await user.type(await screen.findByRole("textbox"), "https://cdn.example.com/acme.png");
    await user.click(screen.getByRole("button", { name: /apply/i }));

    expect(onImageChange).toHaveBeenCalledWith({ url: "https://cdn.example.com/acme.png" });
    expect(handleToggle).toHaveBeenCalledWith(false);
  });

  it("refuses a URL with an unsafe scheme", async () => {
    const user = userEvent.setup();
    const onImageChange = vi.fn();
    render(
      <EmojiPicker
        isOpen
        handleToggle={vi.fn()}
        onChange={vi.fn()}
        onImageChange={onImageChange}
        defaultOpen="image"
        label={<span>Pick logo</span>}
      />
    );

    const input = await screen.findByRole("textbox");
    await user.type(input, "javascript:alert(1){Enter}");

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /apply/i }).disabled).toBe(true);
    expect(onImageChange).not.toHaveBeenCalled();
  });
});
