import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, EButtonVariant, EButtonSize } from "./button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: Object.values(EButtonVariant),
    },
    size: {
      control: "select",
      options: Object.values(EButtonSize),
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const Primary: Story = {
  args: {
    variant: EButtonVariant.PRIMARY,
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: EButtonVariant.SECONDARY,
    children: "Secondary Button",
  },
};

export const Outline: Story = {
  args: {
    variant: EButtonVariant.OUTLINE,
    children: "Outline Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: EButtonVariant.GHOST,
    children: "Ghost Button",
  },
};

export const Destructive: Story = {
  args: {
    variant: EButtonVariant.DESTRUCTIVE,
    children: "Destructive Button",
  },
};

export const Small: Story = {
  args: {
    size: EButtonSize.SM,
    children: "Small Button",
  },
};

export const Medium: Story = {
  args: {
    size: EButtonSize.MD,
    children: "Medium Button",
  },
};

export const Large: Story = {
  args: {
    size: EButtonSize.LG,
    children: "Large Button",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={EButtonVariant.PRIMARY}>Primary</Button>
        <Button variant={EButtonVariant.SECONDARY}>Secondary</Button>
        <Button variant={EButtonVariant.OUTLINE}>Outline</Button>
        <Button variant={EButtonVariant.GHOST}>Ghost</Button>
        <Button variant={EButtonVariant.DESTRUCTIVE}>Destructive</Button>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size={EButtonSize.SM}>Small</Button>
        <Button size={EButtonSize.MD}>Medium</Button>
        <Button size={EButtonSize.LG}>Large</Button>
      </div>
    </div>
  ),
};
