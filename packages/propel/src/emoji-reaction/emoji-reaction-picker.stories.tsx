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
import { fn } from "storybook/test";
import { EmojiReactionPicker } from "./emoji-reaction-picker";

const meta = preview.meta({
  title: "Media/Emoji Reaction Picker",
  component: EmojiReactionPicker,
  parameters: {
    layout: "centered",
  },
  args: {
    isOpen: false,
    handleToggle: fn(),
    onChange: fn(),
    label: "Pick Emoji",
  },
});

export const Default = meta.story({});

export const Open = meta.story({
  args: {
    isOpen: true,
  },
});

export const CloseOnSelect = meta.story({
  args: {
    isOpen: true,
    closeOnSelect: true,
  },
});

export const CloseOnSelectDisabled = meta.story({
  args: {
    isOpen: true,
    closeOnSelect: false,
  },
});

export const SearchDisabled = meta.story({
  args: {
    isOpen: true,
    searchDisabled: true,
  },
});

export const CustomSearchPlaceholder = meta.story({
  args: {
    isOpen: true,
    searchPlaceholder: "Find your emoji...",
  },
});

export const CustomLabel = meta.story({
  args: {
    label: "Add Reaction",
  },
});
