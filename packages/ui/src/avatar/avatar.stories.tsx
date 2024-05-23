import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Avatar } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "Avatar",
  component: Avatar,
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: { name: "John Doe" },
};

export const Large: Story = {
  args: { name: "John Doe" },
};
