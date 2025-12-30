import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Badge",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Neutral: Story = {
  args: {
    variant: "neutral",
    children: "Neutral Badge",
  },
};

export const Brand: Story = {
  args: {
    variant: "brand",
    children: "Brand Badge",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning Badge",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success Badge",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Danger Badge",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Badge",
  },
};

export const Base: Story = {
  args: {
    size: "base",
    children: "Base Badge",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Badge",
  },
};

export const WithPrependIcon: Story = {
  args: {
    prependIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14m-7-7h14" />
      </svg>
    ),
    children: "With Prepend Icon",
  },
};

export const WithAppendIcon: Story = {
  args: {
    appendIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    ),
    children: "With Append Icon",
  },
};

export const AllVariants: Story = {
  render() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-16 font-semibold">Primary Variants</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="brand">Brand</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
          </div>
        </div>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge size="sm">Small</Badge>
          <Badge size="base">Base</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </div>
    );
  },
};
