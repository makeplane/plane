import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./index";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  args: {
    children: null,
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    return (
      <Skeleton className="w-80 flex flex-col gap-2">
        <Skeleton.Item height="40px" width="100%" />
      </Skeleton>
    );
  },
};

export const Card: Story = {
  render() {
    return (
      <Skeleton className="w-80 flex flex-col gap-4">
        <Skeleton.Item height="200px" width="100%" />
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="20px" width="60%" />
          <Skeleton.Item height="16px" width="40%" />
        </div>
      </Skeleton>
    );
  },
};

export const List: Story = {
  render() {
    return (
      <Skeleton className="w-96 flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton.Item height="40px" width="40px" className="rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton.Item height="16px" width="70%" />
              <Skeleton.Item height="12px" width="50%" />
            </div>
          </div>
        ))}
      </Skeleton>
    );
  },
};

export const Table: Story = {
  render() {
    return (
      <Skeleton className="w-full flex flex-col gap-3">
        <div className="flex gap-4">
          <Skeleton.Item height="20px" width="150px" />
          <Skeleton.Item height="20px" width="200px" />
          <Skeleton.Item height="20px" width="120px" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton.Item height="40px" width="150px" />
            <Skeleton.Item height="40px" width="200px" />
            <Skeleton.Item height="40px" width="120px" />
          </div>
        ))}
      </Skeleton>
    );
  },
};

export const Profile: Story = {
  render() {
    return (
      <Skeleton className="w-80 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Skeleton.Item height="80px" width="80px" className="rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton.Item height="20px" width="60%" />
            <Skeleton.Item height="16px" width="40%" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="16px" width="100%" />
          <Skeleton.Item height="16px" width="90%" />
          <Skeleton.Item height="16px" width="70%" />
        </div>
      </Skeleton>
    );
  },
};

export const Avatar: Story = {
  render() {
    return (
      <Skeleton className="flex gap-2">
        <Skeleton.Item height="40px" width="40px" className="rounded-full" />
      </Skeleton>
    );
  },
};

export const AvatarGroup: Story = {
  render() {
    return (
      <Skeleton className="flex -space-x-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton.Item key={i} height="40px" width="40px" className="rounded-full border-2 border-white" />
        ))}
      </Skeleton>
    );
  },
};

export const Text: Story = {
  render() {
    return (
      <Skeleton className="w-96 flex flex-col gap-2">
        <Skeleton.Item height="16px" width="100%" />
        <Skeleton.Item height="16px" width="95%" />
        <Skeleton.Item height="16px" width="90%" />
        <Skeleton.Item height="16px" width="60%" />
      </Skeleton>
    );
  },
};

export const Button: Story = {
  render() {
    return (
      <Skeleton className="inline-flex">
        <Skeleton.Item height="40px" width="120px" className="rounded-md" />
      </Skeleton>
    );
  },
};

export const Input: Story = {
  render() {
    return (
      <Skeleton className="w-80 flex flex-col gap-2">
        <Skeleton.Item height="14px" width="80px" />
        <Skeleton.Item height="40px" width="100%" className="rounded-md" />
      </Skeleton>
    );
  },
};

export const Form: Story = {
  render() {
    return (
      <Skeleton className="w-96 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="14px" width="80px" />
          <Skeleton.Item height="40px" width="100%" className="rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="14px" width="100px" />
          <Skeleton.Item height="40px" width="100%" className="rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="14px" width="60px" />
          <Skeleton.Item height="80px" width="100%" className="rounded-md" />
        </div>
        <Skeleton.Item height="40px" width="120px" className="rounded-md" />
      </Skeleton>
    );
  },
};

export const ProductCard: Story = {
  render() {
    return (
      <Skeleton className="w-72 flex flex-col gap-3 p-4 border rounded-lg">
        <Skeleton.Item height="200px" width="100%" className="rounded-md" />
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="20px" width="80%" />
          <Skeleton.Item height="16px" width="60%" />
          <Skeleton.Item height="24px" width="40%" />
        </div>
        <Skeleton.Item height="40px" width="100%" className="rounded-md" />
      </Skeleton>
    );
  },
};
