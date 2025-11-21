import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton, SkeletonItem } from "./index";

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
        <SkeletonItem height="40px" width="100%" />
      </Skeleton>
    );
  },
};

export const Card: Story = {
  render() {
    return (
      <Skeleton className="w-80 flex flex-col gap-4">
        <SkeletonItem height="200px" width="100%" />
        <div className="flex flex-col gap-2">
          <SkeletonItem height="20px" width="60%" />
          <SkeletonItem height="16px" width="40%" />
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
            <SkeletonItem height="40px" width="40px" className="rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <SkeletonItem height="16px" width="70%" />
              <SkeletonItem height="12px" width="50%" />
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
          <SkeletonItem height="20px" width="150px" />
          <SkeletonItem height="20px" width="200px" />
          <SkeletonItem height="20px" width="120px" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <SkeletonItem height="40px" width="150px" />
            <SkeletonItem height="40px" width="200px" />
            <SkeletonItem height="40px" width="120px" />
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
          <SkeletonItem height="80px" width="80px" className="rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <SkeletonItem height="20px" width="60%" />
            <SkeletonItem height="16px" width="40%" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <SkeletonItem height="16px" width="100%" />
          <SkeletonItem height="16px" width="90%" />
          <SkeletonItem height="16px" width="70%" />
        </div>
      </Skeleton>
    );
  },
};

export const Avatar: Story = {
  render() {
    return (
      <Skeleton className="flex gap-2">
        <SkeletonItem height="40px" width="40px" className="rounded-full" />
      </Skeleton>
    );
  },
};

export const AvatarGroup: Story = {
  render() {
    return (
      <Skeleton className="flex -space-x-2">
        {[...Array(4)].map((_, i) => (
          <SkeletonItem key={i} height="40px" width="40px" className="rounded-full border-2 border-white" />
        ))}
      </Skeleton>
    );
  },
};

export const Text: Story = {
  render() {
    return (
      <Skeleton className="w-96 flex flex-col gap-2">
        <SkeletonItem height="16px" width="100%" />
        <SkeletonItem height="16px" width="95%" />
        <SkeletonItem height="16px" width="90%" />
        <SkeletonItem height="16px" width="60%" />
      </Skeleton>
    );
  },
};

export const Button: Story = {
  render() {
    return (
      <Skeleton className="inline-flex">
        <SkeletonItem height="40px" width="120px" className="rounded-md" />
      </Skeleton>
    );
  },
};

export const Input: Story = {
  render() {
    return (
      <Skeleton className="w-80 flex flex-col gap-2">
        <SkeletonItem height="14px" width="80px" />
        <SkeletonItem height="40px" width="100%" className="rounded-md" />
      </Skeleton>
    );
  },
};

export const Form: Story = {
  render() {
    return (
      <Skeleton className="w-96 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SkeletonItem height="14px" width="80px" />
          <SkeletonItem height="40px" width="100%" className="rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <SkeletonItem height="14px" width="100px" />
          <SkeletonItem height="40px" width="100%" className="rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <SkeletonItem height="14px" width="60px" />
          <SkeletonItem height="80px" width="100%" className="rounded-md" />
        </div>
        <SkeletonItem height="40px" width="120px" className="rounded-md" />
      </Skeleton>
    );
  },
};

export const ProductCard: Story = {
  render() {
    return (
      <Skeleton className="w-72 flex flex-col gap-3 p-4 border rounded-lg">
        <SkeletonItem height="200px" width="100%" className="rounded-md" />
        <div className="flex flex-col gap-2">
          <SkeletonItem height="20px" width="80%" />
          <SkeletonItem height="16px" width="60%" />
          <SkeletonItem height="24px" width="40%" />
        </div>
        <SkeletonItem height="40px" width="100%" className="rounded-md" />
      </Skeleton>
    );
  },
};
