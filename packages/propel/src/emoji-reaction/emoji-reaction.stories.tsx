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
import { useArgs } from "storybook/preview-api";

import { EmojiReaction } from "./emoji-reaction";

const meta = preview.meta({
  component: EmojiReaction,
  parameters: {
    layout: "centered",
  },
});

export const Single = meta.story({
  args: {
    emoji: "👍",
    count: 5,
    reacted: false,
    users: ["Alice", "Bob", "Charlie"],
  },
});

export const Reacted = meta.story({
  args: {
    emoji: "❤️",
    count: 12,
    reacted: true,
    users: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank"],
  },
});

export const Interactive = meta.story({
  args: {
    emoji: "👍",
    count: 5,
    reacted: false,
    users: ["Alice", "Bob", "Charlie"],
  },
  render: function Render(args) {
    const [{ count, reacted }, updateArgs] = useArgs<typeof args>();

    const handleClick = () => {
      updateArgs({
        reacted: !reacted,
        count: reacted ? count - 1 : count + 1,
      });
    };

    return (
      <div className="flex flex-col gap-4 items-center">
        <EmojiReaction {...args} count={count} reacted={reacted} onReactionClick={handleClick} />
        <p className="text-13 text-placeholder">Click to toggle reaction</p>
      </div>
    );
  },
});

export const WithTooltip = meta.story({
  args: {
    emoji: "🎉",
    count: 8,
    reacted: false,
    users: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry"],
  },
});

export const WithoutCount = meta.story({
  args: {
    emoji: "🔥",
    count: 0,
    reacted: false,
    showCount: false,
  },
});

export const ManyUsers = meta.story({
  args: {
    emoji: "🎉",
    count: 47,
    reacted: true,
    users: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry", "Ivy", "Jack", "Kate", "Liam"],
  },
});
