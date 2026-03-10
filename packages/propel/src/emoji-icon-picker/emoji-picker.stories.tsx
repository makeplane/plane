/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import preview from "#.storybook/preview";
import { expect, fn, screen } from "storybook/test";
import { EmojiPicker } from "./emoji-picker";
import { EmojiIconPickerTypes } from "./helper";

const meta = preview.meta({
  title: "Media/Emoji Icon Picker",
  component: EmojiPicker,
  parameters: {
    layout: "centered",
  },
  args: {
    isOpen: false,
    handleToggle: fn(),
    onChange: fn(),
    label: "Pick an emoji or icon",
  },
});

export const Default = meta.story({});

export const Open = meta.story({
  args: {
    isOpen: true,
  },
  async play() {
    await expect(await screen.findByText("Emoji")).toBeVisible();
    await expect(screen.getByText("Icon")).toBeVisible();
  },
});

export const OpenToIconTab = meta.story({
  args: {
    isOpen: true,
    defaultOpen: EmojiIconPickerTypes.ICON,
  },
  async play() {
    await expect(await screen.findByText("Icon")).toBeVisible();
    await expect(screen.getByText("Colors will be adjusted to ensure sufficient contrast.")).toBeVisible();
  },
});

export const SelectEmoji = meta.story({
  args: {
    isOpen: true,
  },
  async play({ userEvent }) {
    await expect(await screen.findByText("Emoji")).toBeVisible();
    const emojiButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("data-slot") === "emoji-picker-list-emoji");
    if (emojiButton) {
      await userEvent.click(emojiButton);
    }
  },
});

export const SelectIcon = meta.story({
  args: {
    isOpen: true,
    defaultOpen: EmojiIconPickerTypes.ICON,
  },
  async play({ userEvent }) {
    await expect(await screen.findByText("Icon")).toBeVisible();
    const colorButtons = screen.getAllByRole("button").filter((btn) => {
      const span = btn.querySelector<HTMLSpanElement>("span.rounded-full");
      return span && span.style.backgroundColor;
    });
    if (colorButtons[0]) {
      await userEvent.click(colorButtons[0]);
    }
    const iconButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.classList.contains("h-9") && btn.classList.contains("w-9"));
    if (iconButtons[0]) {
      await userEvent.click(iconButtons[0]);
    }
  },
});

export const LucideIcons = meta.story({
  args: {
    isOpen: true,
    defaultOpen: EmojiIconPickerTypes.ICON,
    iconType: "lucide",
  },
});

export const MaterialIcons = meta.story({
  args: {
    isOpen: true,
    defaultOpen: EmojiIconPickerTypes.ICON,
    iconType: "material",
  },
});

export const CloseOnSelectDisabled = meta.story({
  args: {
    isOpen: true,
    closeOnSelect: false,
  },
  async play({ userEvent }) {
    await expect(await screen.findByText("Emoji")).toBeVisible();
    const emojiButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("data-slot") === "emoji-picker-list-emoji");
    if (emojiButton) {
      await userEvent.click(emojiButton);
    }
    await expect(screen.getByText("Emoji")).toBeVisible();
  },
});

export const CustomSearchPlaceholder = meta.story({
  args: {
    isOpen: true,
    searchPlaceholder: "Type to find emojis...",
  },
});

export const SearchDisabled = meta.story({
  args: {
    isOpen: true,
    searchDisabled: true,
  },
});

export const CustomIconColor = meta.story({
  args: {
    isOpen: true,
    defaultOpen: EmojiIconPickerTypes.ICON,
    defaultIconColor: "#FF5733",
  },
});

export const Disabled = meta.story({
  args: {
    disabled: true,
  },
});

export const WithSideAndAlign = meta.story({
  args: {
    isOpen: true,
    side: "top",
    align: "start",
    placement: undefined,
  },
});

export const EscapeToClose = meta.story({
  args: {
    isOpen: true,
  },
  async play() {
    await expect(await screen.findByText("Emoji")).toBeVisible();
    const content = document.querySelector("[data-prevent-outside-click]");
    if (content) {
      content.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    }
    if (content) {
      content.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    }
    if (content) {
      content.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    }
  },
});

export const ToggleHexInput = meta.story({
  args: {
    isOpen: true,
    defaultOpen: EmojiIconPickerTypes.ICON,
    defaultIconColor: "#FF5733",
  },
  async play({ userEvent }) {
    await expect(await screen.findByText("Icon")).toBeVisible();
    await expect(screen.getByText("HEX")).toBeVisible();
    const hexInput = screen.getByDisplayValue("FF5733");
    if (hexInput) {
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, "00ff00");
    }
    const toggleBtn = screen.getAllByRole("button").find((btn) => btn.querySelector(".conical-gradient"));
    if (toggleBtn) {
      await userEvent.click(toggleBtn);
    }
    const hashBtn = screen.getAllByRole("button").find((btn) => btn.textContent?.trim() === "#");
    if (hashBtn) {
      await userEvent.click(hashBtn);
    }
  },
});

export const SearchInteraction = meta.story({
  args: {
    isOpen: true,
  },
  async play({ userEvent }) {
    await expect(await screen.findByText("Emoji")).toBeVisible();
    const searchInput = screen.getByPlaceholderText("Search");
    if (searchInput) {
      await userEvent.type(searchInput, "smile");
    }
    const iconTab = screen.getByText("Icon");
    await userEvent.click(iconTab);
    await expect(screen.getByText("Colors will be adjusted to ensure sufficient contrast.")).toBeVisible();
  },
});

export const IconSearchAndFocus = meta.story({
  args: {
    isOpen: true,
    defaultOpen: EmojiIconPickerTypes.ICON,
  },
  async play({ userEvent }) {
    await expect(await screen.findByText("Icon")).toBeVisible();
    const searchInput = screen.getByPlaceholderText("Search");
    if (searchInput) {
      await userEvent.click(searchInput);
      await userEvent.type(searchInput, "star");
      await userEvent.tab();
    }
  },
});
