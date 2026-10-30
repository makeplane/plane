/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmojiReaction, EmojiReactionButton, EmojiReactionGroup } from "./emoji-reaction";
import { EmojiReactionPicker } from "./emoji-reaction-picker";

vi.mock("../emoji-icon-picker/emoji/emoji", () => ({
  EmojiRoot: ({
    onChange,
    searchQuery,
    onSearchQueryChange,
  }: {
    onChange: (emoji: string) => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
  }) => (
    <div data-testid="emoji-grid">
      <input
        aria-label="Search emoji"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
      />
      <button type="button" onClick={() => onChange("👍")}>
        Select thumbs up
      </button>
    </div>
  ),
}));

function ControlledPicker({
  disabled = false,
  closeOnSelect = true,
  onChange = vi.fn(),
  onReactionClick = vi.fn(),
  showAddButton = true,
}: {
  disabled?: boolean;
  closeOnSelect?: boolean;
  onChange?: (emoji: string) => void;
  onReactionClick?: (emoji: string) => void;
  showAddButton?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <EmojiReactionGroup
      disabled={disabled}
      reactions={[{ emoji: "👍", count: 2, reacted: true }]}
      onReactionClick={onReactionClick}
      showAddButton={showAddButton}
      addReactionButton={
        <EmojiReactionPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={onChange}
          disabled={disabled}
          closeOnSelect={closeOnSelect}
          render={<EmojiReactionButton />}
        />
      }
    />
  );
}

describe("EmojiReactionPicker popover", () => {
  it("opens on the add trigger and marks the panel as preventing outside click", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    expect(document.querySelector("[data-prevent-outside-click]")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add reaction" }));
    expect(await screen.findByTestId("emoji-grid")).toBeDefined();
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
  });

  it("retains the label-only trigger contract", async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(
      <EmojiReactionPicker
        isOpen={false}
        handleToggle={handleToggle}
        onChange={vi.fn()}
        label={<span>Legacy add reaction</span>}
      />
    );
    await user.click(screen.getByRole("button", { name: "Legacy add reaction" }));
    expect(handleToggle).toHaveBeenCalledWith(true);
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

  it("keeps reaction toggles outside the add trigger without nesting buttons", async () => {
    const user = userEvent.setup();
    const onReactionClick = vi.fn();
    render(<ControlledPicker onReactionClick={onReactionClick} />);
    const reaction = screen.getByRole("button", { name: "Add reaction: 👍 (2)" });
    expect(document.querySelector("button button")).toBeNull();
    await user.click(reaction);
    expect(onReactionClick).toHaveBeenCalledExactlyOnceWith("👍");
    expect(screen.queryByTestId("emoji-grid")).toBeNull();
    reaction.focus();
    await user.keyboard("{Enter}");
    expect(onReactionClick).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("emoji-grid")).toBeNull();
  });

  it.each(["{Enter}", " "])("supports %s activation, Escape dismissal and trigger focus return", async (key) => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    const trigger = screen.getByRole("button", { name: "Add reaction" });
    trigger.focus();
    await user.keyboard(key);
    expect(await screen.findByTestId("emoji-grid")).toBeDefined();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByTestId("emoji-grid")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("resets search on reopen and preserves decimal selection and closeOnSelect", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledPicker onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: "Add reaction" });
    await user.click(trigger);
    await user.type(screen.getByRole("textbox", { name: "Search emoji" }), "thumb");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByTestId("emoji-grid")).toBeNull());
    await user.click(trigger);
    expect((screen.getByRole("textbox", { name: "Search emoji" }) as HTMLInputElement).value).toBe("");
    await user.click(screen.getByRole("button", { name: "Select thumbs up" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("128077");
    await waitFor(() => expect(screen.queryByTestId("emoji-grid")).toBeNull());
  });

  it("retains the picker and query when closeOnSelect is false", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledPicker closeOnSelect={false} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Add reaction" }));
    await user.type(screen.getByRole("textbox", { name: "Search emoji" }), "thumb");
    await user.click(screen.getByRole("button", { name: "Select thumbs up" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("128077");
    expect((screen.getByRole("textbox", { name: "Search emoji" }) as HTMLInputElement).value).toBe("thumb");
    expect(screen.getByTestId("emoji-grid")).toBeDefined();
  });

  it("prevents a disabled add trigger from opening", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker disabled />);
    const trigger = screen.getByRole("button", { name: "Add reaction" });
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    await user.click(trigger);
    expect(screen.queryByTestId("emoji-grid")).toBeNull();
  });

  it("keeps disabled reaction controls out of keyboard focus and blocks their callbacks", async () => {
    const user = userEvent.setup();
    const onReactionClick = vi.fn();
    render(<ControlledPicker disabled onReactionClick={onReactionClick} />);
    const reaction = screen.getByRole("button", { name: "Add reaction: 👍 (2)" });
    const add = screen.getByRole("button", { name: "Add reaction" });
    expect((reaction as HTMLButtonElement).disabled).toBe(true);
    await user.click(reaction);
    await user.click(add);
    await user.tab();
    expect(document.activeElement).not.toBe(reaction);
    expect(document.activeElement).not.toBe(add);
    expect(onReactionClick).not.toHaveBeenCalled();
    expect(screen.queryByTestId("emoji-grid")).toBeNull();
  });

  it("disables iframe-style reaction groups with no add control", async () => {
    const user = userEvent.setup();
    const onReactionClick = vi.fn();
    render(<ControlledPicker disabled showAddButton={false} onReactionClick={onReactionClick} />);
    const reaction = screen.getByRole("button", { name: "Add reaction: 👍 (2)" });
    expect((reaction as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Add reaction" })).toBeNull();
    await user.click(reaction);
    await user.tab();
    expect(document.activeElement).not.toBe(reaction);
    expect(onReactionClick).not.toHaveBeenCalled();
  });

  it("forwards group disabled state to the add slot and default add control", () => {
    const { rerender } = render(
      <EmojiReactionGroup reactions={[]} disabled addReactionButton={<EmojiReactionButton />} />
    );
    expect((screen.getByRole("button", { name: "Add reaction" }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<EmojiReactionGroup reactions={[]} disabled />);
    expect((screen.getByRole("button", { name: "Add reaction" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps existing reactions visible when the add action is hidden", () => {
    render(<ControlledPicker showAddButton={false} />);
    expect(screen.queryByRole("button", { name: "Add reaction" })).toBeNull();
    expect(screen.getByRole("button", { name: "Add reaction: 👍 (2)" })).toBeDefined();
  });
});

describe("EmojiReaction accessibility", () => {
  it("exposes selected state and a reaction name while preserving the visible count", () => {
    const { rerender } = render(<EmojiReaction emoji="👍" count={2} reacted />);
    expect(screen.getByRole("button", { name: "Add reaction: 👍 (2)" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("2")).toBeDefined();
    rerender(<EmojiReaction emoji="👍" count={2} reacted={false} />);
    expect(screen.getByRole("button", { name: "Add reaction: 👍 (2)" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("preserves explicit button attributes and caller label overrides", () => {
    render(<EmojiReaction emoji="👍" count={2} aria-label="Custom reaction" disabled showCount={false} />);
    expect((screen.getByRole("button", { name: "Custom reaction" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("2")).toBeNull();
  });
});
