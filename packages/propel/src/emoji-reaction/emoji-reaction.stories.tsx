import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmojiReaction, EmojiReactionGroup, EmojiReactionButton, EmojiReactionType } from "./emoji-reaction";

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
  render() {
    const [reacted, setReacted] = useState(false);
    const [count, setCount] = useState(5);

    const handleClick = () => {
      setReacted(!reacted);
      setCount(reacted ? count - 1 : count + 1);
    };

    return (
      <div className="flex flex-col gap-4 items-center">
        <EmojiReaction
          emoji="👍"
          count={count}
          reacted={reacted}
          users={["Alice", "Bob", "Charlie"]}
          onReactionClick={handleClick}
        />
        <p className="text-sm text-custom-text-400">Click to toggle reaction</p>
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

export const Sizes: Story = {
  render() {
    return (
      <div className="flex flex-col gap-4 items-center">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-custom-text-400">Small</span>
          <EmojiReaction emoji="👍" count={5} size="sm" users={["Alice", "Bob"]} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-custom-text-400">Medium (default)</span>
          <EmojiReaction emoji="👍" count={5} size="md" users={["Alice", "Bob"]} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-custom-text-400">Large</span>
          <EmojiReaction emoji="👍" count={5} size="lg" users={["Alice", "Bob"]} />
        </div>
      </div>
    );
  },
};

export const MultipleReactions: Story = {
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
  render() {
    const handleAdd = () => {
      alert("Add reaction clicked");
    };

    return <EmojiReactionButton onAddReaction={handleAdd} />;
  },
};

export const AddButtonSizes: Story = {
  render() {
    return (
      <div className="flex gap-4 items-center">
        <div className="flex flex-col gap-2 items-center">
          <span className="text-xs text-custom-text-400">Small</span>
          <EmojiReactionButton size="sm" />
        </div>
        <div className="flex flex-col gap-2 items-center">
          <span className="text-xs text-custom-text-400">Medium</span>
          <EmojiReactionButton size="md" />
        </div>
        <div className="flex flex-col gap-2 items-center">
          <span className="text-xs text-custom-text-400">Large</span>
          <EmojiReactionButton size="lg" />
        </div>
      </div>
    );
  },
};

export const ReactionGroup: Story = {
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

export const ReactionGroupSizes: Story = {
  render() {
    const reactions: EmojiReactionType[] = [
      { emoji: "👍", count: 5, reacted: false, users: ["Alice", "Bob"] },
      { emoji: "❤️", count: 12, reacted: true, users: ["Charlie", "David"] },
      { emoji: "🎉", count: 3, reacted: false, users: ["Emma"] },
    ];

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-custom-text-400">Small</span>
          <EmojiReactionGroup reactions={reactions} size="sm" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-custom-text-400">Medium</span>
          <EmojiReactionGroup reactions={reactions} size="md" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-custom-text-400">Large</span>
          <EmojiReactionGroup reactions={reactions} size="lg" />
        </div>
      </div>
    );
  },
};

export const InMessageContext: Story = {
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
      <div className="max-w-md border border-custom-border-200 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-custom-primary-100 flex items-center justify-center text-white text-sm">
            AB
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">Alice Brown</div>
            <div className="text-sm text-custom-text-300 mt-1">
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
