import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmojiReaction } from "./emoji-reaction";

const meta: Meta<typeof EmojiReaction> = {
  title: "Components/Emoji/EmojiReaction",
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
