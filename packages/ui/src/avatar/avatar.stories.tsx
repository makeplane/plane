import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Avatar } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "Avatar",
  component: Avatar,
  args: {
    name: "John Doe",
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {};

export const Large: Story = {
  args: {
    size: "lg",
  }
};
