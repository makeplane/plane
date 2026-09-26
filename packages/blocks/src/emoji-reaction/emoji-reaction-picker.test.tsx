/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmojiReactionPicker } from "./emoji-reaction-picker";

vi.mock("../emoji-icon-picker/emoji/emoji", () => ({
  EmojiRoot: () => <div data-testid="emoji-grid">emoji grid</div>,
}));

function ControlledPicker() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <EmojiReactionPicker
      isOpen={isOpen}
      handleToggle={setIsOpen}
      onChange={vi.fn()}
      label={<span>Add reaction</span>}
    />
  );
}

describe("EmojiReactionPicker popover", () => {
  it("opens on trigger click and marks the panel as preventing outside click", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    expect(document.querySelector("[data-prevent-outside-click]")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add reaction" }));
    expect(await screen.findByTestId("emoji-grid")).toBeDefined();
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
  });

  it("keeps the prevent-outside panel while open and drops it when closed", () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <EmojiReactionPicker isOpen handleToggle={handleToggle} onChange={vi.fn()} label={<span>Add reaction</span>} />
    );
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
    rerender(
      <EmojiReactionPicker
        isOpen={false}
        handleToggle={handleToggle}
        onChange={vi.fn()}
        label={<span>Add reaction</span>}
      />
    );
    const panel = document.querySelector("[data-prevent-outside-click]");
    expect(panel == null || panel.hasAttribute("data-closed")).toBe(true);
  });
});
