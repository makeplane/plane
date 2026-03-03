/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { EmojiReactionType } from "./emoji-reaction";
import { EmojiReaction, EmojiReactionGroup, EmojiReactionButton } from "./emoji-reaction";

const meta = {
  title: "Components/Emoji/EmojiReaction",
  component: EmojiReaction,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmojiReaction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    emoji: "👍",
    count: 5,
    reacted: false,
    users: ["Alice", "Bob", "Charlie"],
  },
};

export const Reacted: Story = {
  args: {
    emoji: "❤️",
    count: 12,
    reacted: true,
    users: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank"],
  },
};

export const Interactive: Story = {
  args: {
    emoji: "👍",
    count: 0,
  },
  render() {
    const [reacted, setReacted] = useState(false);
    const [count, setCount] = useState(5);

    const handleClick = () => {
      setReacted(!reacted);
      setCount(reacted ? count - 1 : count + 1);
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <EmojiReaction
          emoji="👍"
          count={count}
          reacted={reacted}
          users={["Alice", "Bob", "Charlie"]}
          onReactionClick={handleClick}
        />
        <p className="text-13 text-placeholder">Click to toggle reaction</p>
      </div>
    );
  },
};

export const WithTooltip: Story = {
  args: {
    emoji: "🎉",
    count: 8,
    reacted: false,
    users: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry"],
  },
};

export const WithoutCount: Story = {
  args: {
    emoji: "🔥",
    count: 0,
    reacted: false,
    showCount: false,
  },
};

export const MultipleReactions: Story = {
  args: {
    emoji: "👍",
    count: 0,
  },
  render() {
    const [reactions, setReactions] = useState<EmojiReactionType[]>([
      { emoji: "👍", count: 5, reacted: false, users: ["Alice", "Bob", "Charlie"] },
      { emoji: "❤️", count: 12, reacted: true, users: ["David", "Emma", "Frank"] },
      { emoji: "🎉", count: 3, reacted: false, users: ["Grace"] },
    ]);

    const handleReactionClick = (emoji: string) => {
      setReactions((prev) =>
        prev.map((r) => {
          if (r.emoji === emoji) {
            return {
              ...r,
              reacted: !r.reacted,
              count: r.reacted ? r.count - 1 : r.count + 1,
            };
          }
          return r;
        })
      );
    };

    return (
      <div className="flex gap-2">
        {reactions.map((reaction) => (
          <EmojiReaction
            key={reaction.emoji}
            emoji={reaction.emoji}
            count={reaction.count}
            reacted={reaction.reacted}
            users={reaction.users}
            onReactionClick={handleReactionClick}
          />
        ))}
      </div>
    );
  },
};

export const AddButton: Story = {
  args: {
    emoji: "➕",
    count: 0,
  },
  render() {
    const handleAdd = () => {
      alert("Add reaction clicked");
    };

    return <EmojiReactionButton onAddReaction={handleAdd} />;
  },
};

export const ReactionGroup: Story = {
  args: {
    emoji: "👍",
    count: 0,
  },
  render() {
    const [reactions, setReactions] = useState<EmojiReactionType[]>([
      { emoji: "👍", count: 5, reacted: false, users: ["Alice", "Bob", "Charlie"] },
      { emoji: "❤️", count: 12, reacted: true, users: ["David", "Emma", "Frank"] },
      { emoji: "🎉", count: 3, reacted: false, users: ["Grace"] },
      { emoji: "🔥", count: 8, reacted: false, users: ["Henry", "Ivy"] },
    ]);

    const handleReactionClick = (emoji: string) => {
      setReactions((prev) =>
        prev.map((r) => {
          if (r.emoji === emoji) {
            return {
              ...r,
              reacted: !r.reacted,
              count: r.reacted ? r.count - 1 : r.count + 1,
            };
          }
          return r;
        })
      );
    };

    const handleAddReaction = () => {
      alert("Add reaction clicked");
    };

    return (
      <EmojiReactionGroup
        reactions={reactions}
        onReactionClick={handleReactionClick}
        onAddReaction={handleAddReaction}
      />
    );
  },
};

export const InMessageContext: Story = {
  args: {
    emoji: "👍",
    count: 0,
  },
  render() {
    const [reactions, setReactions] = useState<EmojiReactionType[]>([
      { emoji: "👍", count: 5, reacted: false, users: ["Alice", "Bob", "Charlie"] },
      { emoji: "❤️", count: 2, reacted: true, users: ["You", "David"] },
    ]);

    const handleReactionClick = (emoji: string) => {
      setReactions((prev) =>
        prev.map((r) => {
          if (r.emoji === emoji) {
            return {
              ...r,
              reacted: !r.reacted,
              count: r.reacted ? r.count - 1 : r.count + 1,
            };
          }
          return r;
        })
      );
    };

    return (
      <div className="max-w-md space-y-3 rounded-lg border border-subtle p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-13 text-on-color">
            AB
          </div>
          <div className="flex-1">
            <div className="text-13 font-medium">Alice Brown</div>
            <div className="mt-1 text-13 text-tertiary">
              Hey everyone! Just wanted to share some exciting news about our project launch next week!
            </div>
          </div>
        </div>
        <EmojiReactionGroup reactions={reactions} onReactionClick={handleReactionClick} />
      </div>
    );
  },
};

export const ManyUsers: Story = {
  args: {
    emoji: "🎉",
    count: 47,
    reacted: true,
    users: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry", "Ivy", "Jack", "Kate", "Liam"],
  },
};
