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
import { EmojiReactionGroup } from "./emoji-reaction";

const meta = preview.meta({
  component: EmojiReactionGroup,
  parameters: {
    layout: "centered",
  },
  args: {
    reactions: [],
    onReactionClick: fn(),
    onAddReaction: fn(),
  },
});

export const Default = meta.story({
  args: {
    reactions: [
      { emoji: "👍", count: 5, reacted: false, users: ["Alice", "Bob", "Charlie"] },
      { emoji: "❤️", count: 12, reacted: true, users: ["David", "Emma", "Frank"] },
      { emoji: "🎉", count: 3, reacted: false, users: ["Grace"] },
      { emoji: "🔥", count: 8, reacted: false, users: ["Henry", "Ivy"] },
    ],
  },
});

export const Empty = meta.story({
  args: {
    reactions: [],
  },
});

export const SingleReaction = meta.story({
  args: {
    reactions: [{ emoji: "👍", count: 1, reacted: true, users: ["You"] }],
  },
});

export const NoAddButton = meta.story({
  args: {
    reactions: [
      { emoji: "👍", count: 5, reacted: false, users: ["Alice", "Bob", "Charlie"] },
      { emoji: "❤️", count: 2, reacted: true, users: ["You", "David"] },
    ],
    showAddButton: false,
  },
});
