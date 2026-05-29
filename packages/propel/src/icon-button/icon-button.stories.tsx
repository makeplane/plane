import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./icon-button";

const icon = () => (
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
);

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    icon,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon,
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
    icon,
  },
};

export const ErrorFill: Story = {
  args: {
    variant: "error-fill",
    icon,
  },
};

export const ErrorOutline: Story = {
  args: {
    variant: "error-outline",
    icon,
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    icon,
  },
};

export const Tertiary: Story = {
  args: {
    variant: "tertiary",
    icon,
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    icon,
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    icon,
  },
};

export const Base: Story = {
  args: {
    size: "base",
    icon,
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    icon,
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    icon,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    icon,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    icon,
  },
};

export const AllVariants: Story = {
  render() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-16 font-semibold">Primary Variants</h3>
          <div className="flex flex-wrap gap-2">
            <IconButton variant="primary" icon={icon} />
            <IconButton variant="error-fill" icon={icon} />
            <IconButton variant="error-outline" icon={icon} />
            <IconButton variant="secondary" icon={icon} />
            <IconButton variant="tertiary" icon={icon} />
            <IconButton variant="ghost" icon={icon} />
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
          <IconButton size="sm" icon={icon} />
          <IconButton size="base" icon={icon} />
          <IconButton size="lg" icon={icon} />
          <IconButton size="xl" icon={icon} />
        </div>
      </div>
    );
  },
};

export const AllStates: Story = {
  render() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-16 font-semibold">Button States</h3>
          <div className="flex flex-wrap gap-2">
            <IconButton icon={icon} />
            <IconButton loading icon={icon} />
            <IconButton disabled icon={icon} />
          </div>
        </div>
      </div>
    );
  },
};
