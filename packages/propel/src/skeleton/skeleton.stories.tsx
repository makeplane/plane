import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./index";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Skeleton className="w-80 flex flex-col gap-2">
      <Skeleton.Item height="40px" width="100%" />
    </Skeleton>
  ),
};

export const Card: Story = {
  render: () => (
    <Skeleton className="w-80 flex flex-col gap-4">
      <Skeleton.Item height="200px" width="100%" />
      <div className="flex flex-col gap-2">
        <Skeleton.Item height="20px" width="50%" />
        <Skeleton.Item height="20px" width="30%" />
      </div>
    </Skeleton>
  ),
};
