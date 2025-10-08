import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    name: "John Doe",
    src: "https://i.pravatar.cc/150?img=1",
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithName: Story = {
  args: {
    name: "Jane Smith",
    src: "https://i.pravatar.cc/150?img=5",
  },
};

export const Fallback: Story = {
  args: {
    name: "Alice Johnson",
    src: "invalid-url",
  },
};

export const FallbackWithCustomColor: Story = {
  args: {
    name: "Bob Wilson",
    src: "invalid-url",
    fallbackBackgroundColor: "#3b82f6",
    fallbackTextColor: "#ffffff",
  },
};

export const FallbackWithCustomText: Story = {
  args: {
    fallbackText: "AB",
    src: "invalid-url",
    fallbackBackgroundColor: "#10b981",
    fallbackTextColor: "#ffffff",
  },
};

export const Small: Story = {
  args: {
    name: "Small Avatar",
    src: "https://i.pravatar.cc/150?img=2",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    name: "Medium Avatar",
    src: "https://i.pravatar.cc/150?img=3",
    size: "md",
  },
};

export const Base: Story = {
  args: {
    name: "Base Avatar",
    src: "https://i.pravatar.cc/150?img=4",
    size: "base",
  },
};

export const Large: Story = {
  args: {
    name: "Large Avatar",
    src: "https://i.pravatar.cc/150?img=6",
    size: "lg",
  },
};

export const CircleShape: Story = {
  args: {
    name: "Circle Avatar",
    src: "https://i.pravatar.cc/150?img=7",
    shape: "circle",
  },
};

export const SquareShape: Story = {
  args: {
    name: "Square Avatar",
    src: "https://i.pravatar.cc/150?img=8",
    shape: "square",
  },
};

export const AllSizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render() {
    return (
      <div className="flex items-center gap-4">
        <Avatar name="Small" src="https://i.pravatar.cc/150?img=10" size="sm" />
        <Avatar name="Medium" src="https://i.pravatar.cc/150?img=11" size="md" />
        <Avatar name="Base" src="https://i.pravatar.cc/150?img=12" size="base" />
        <Avatar name="Large" src="https://i.pravatar.cc/150?img=13" size="lg" />
      </div>
    );
  },
};

export const AllShapes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render() {
    return (
      <div className="flex items-center gap-4">
        <Avatar name="Circle" src="https://i.pravatar.cc/150?img=14" shape="circle" />
        <Avatar name="Square" src="https://i.pravatar.cc/150?img=15" shape="square" />
      </div>
    );
  },
};

export const FallbackVariations: Story = {
  parameters: {
    controls: { disable: true },
  },
  render() {
    return (
      <div className="flex items-center gap-4">
        <Avatar name="Alice" src="invalid-url" fallbackBackgroundColor="#ef4444" fallbackTextColor="#ffffff" />
        <Avatar name="Bob" src="invalid-url" fallbackBackgroundColor="#f59e0b" fallbackTextColor="#ffffff" />
        <Avatar name="Charlie" src="invalid-url" fallbackBackgroundColor="#10b981" fallbackTextColor="#ffffff" />
        <Avatar name="David" src="invalid-url" fallbackBackgroundColor="#3b82f6" fallbackTextColor="#ffffff" />
        <Avatar name="Eve" src="invalid-url" fallbackBackgroundColor="#8b5cf6" fallbackTextColor="#ffffff" />
      </div>
    );
  },
};

export const AvatarGroup: Story = {
  parameters: {
    controls: { disable: true },
  },
  render() {
    return (
      <div className="flex -space-x-2">
        <Avatar name="User 1" src="https://i.pravatar.cc/150?img=20" size="md" className="ring-2 ring-white" />
        <Avatar name="User 2" src="https://i.pravatar.cc/150?img=21" size="md" className="ring-2 ring-white" />
        <Avatar name="User 3" src="https://i.pravatar.cc/150?img=22" size="md" className="ring-2 ring-white" />
        <Avatar name="User 4" src="https://i.pravatar.cc/150?img=23" size="md" className="ring-2 ring-white" />
        <Avatar
          fallbackText="+5"
          src="invalid-url"
          size="md"
          fallbackBackgroundColor="#6b7280"
          fallbackTextColor="#ffffff"
          className="ring-2 ring-white"
        />
      </div>
    );
  },
};
