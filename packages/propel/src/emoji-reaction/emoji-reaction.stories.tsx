import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmojiReaction, EmojiReactionGroup, EmojiReactionType } from "./emoji-reaction";

const meta: Meta<typeof EmojiReaction> = {
  title: "EmojiReaction",
  component: EmojiReaction,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmojiReaction>;

export const Single: Story = {
  args: {
    emoji: "👍",
    count: 5,
    reacted: false,
    users: ["User 1", "User 2", "User 3"],
  },
};

export const Reacted: Story = {
  args: {
    emoji: "❤️",
    count: 12,
    reacted: true,
    users: ["User 1", "User 2", "User 3", "User 4", "User 5", "User 6"],
  },
};

const EmojiReactionGroupDemo = () => {
  const [reactions, setReactions] = useState<EmojiReactionType[]>([]);

  const handleReaction = (emoji: string) => {
    setReactions((prev) =>
      prev.map((reaction) =>
        reaction.emoji === emoji
          ? {
              ...reaction,
              count: reaction.reacted ? reaction.count - 1 : reaction.count + 1,
              reacted: !reaction.reacted,
            }
          : reaction
      )
    );
  };

  return (
    <div className="p-4">
      <EmojiReactionGroup
        reactions={reactions}
        onReactionClick={handleReaction}
        onAddReaction={() => console.log("Add reaction clicked")}
      />
    </div>
  );
};

export const Group: Story = {
  render: () => <EmojiReactionGroupDemo />,
};
