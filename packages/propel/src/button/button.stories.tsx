import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Button",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const AccentPrimary: Story = {
  args: {
    variant: "accent-primary",
    children: "Accent Primary Button",
  },
};

export const OutlinePrimary: Story = {
  args: {
    variant: "outline-primary",
    children: "Outline Primary Button",
  },
};

export const NeutralPrimary: Story = {
  args: {
    variant: "neutral-primary",
    children: "Neutral Primary Button",
  },
};

export const LinkPrimary: Story = {
  args: {
    variant: "link-primary",
    children: "Link Primary Button",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Danger Button",
  },
};

export const AccentDanger: Story = {
  args: {
    variant: "accent-danger",
    children: "Accent Danger Button",
  },
};

export const OutlineDanger: Story = {
  args: {
    variant: "outline-danger",
    children: "Outline Danger Button",
  },
};

export const LinkDanger: Story = {
  args: {
    variant: "link-danger",
    children: "Link Danger Button",
  },
};

export const TertiaryDanger: Story = {
  args: {
    variant: "tertiary-danger",
    children: "Tertiary Danger Button",
  },
};

export const LinkNeutral: Story = {
  args: {
    variant: "link-neutral",
    children: "Link Neutral Button",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    children: "Medium Button",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    children: "Extra Large Button",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "Loading Button",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
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
          <h3 className="text-lg font-semibold">Primary Variants</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="accent-primary">Accent Primary</Button>
            <Button variant="outline-primary">Outline Primary</Button>
            <Button variant="neutral-primary">Neutral Primary</Button>
            <Button variant="link-primary">Link Primary</Button>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Danger Variants</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger">Danger</Button>
            <Button variant="accent-danger">Accent Danger</Button>
            <Button variant="outline-danger">Outline Danger</Button>
            <Button variant="link-danger">Link Danger</Button>
            <Button variant="tertiary-danger">Tertiary Danger</Button>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Other Variants</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="link-neutral">Link Neutral</Button>
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
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
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
          <h3 className="text-lg font-semibold">Button States</h3>
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </div>
    );
  },
};
