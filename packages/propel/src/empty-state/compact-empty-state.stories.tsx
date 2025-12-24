import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyStateCompact } from "./compact-empty-state";
import type { BaseEmptyStateCommonProps } from "./types";

const meta: Meta<BaseEmptyStateCommonProps> = {
  title: "Components/EmptyState/Compact",
  component: EmptyStateCompact,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A compact empty state component with centered title, asset, and action buttons. Best used for simple, space-constrained empty states. Supports horizontal stack and illustration assets via `assetKey`.",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description: "The main title text for the empty state",
    },
    assetKey: {
      control: "select",
      options: [
        "customer",
        "epic",
        "estimate",
        "export",
        "intake",
        "label",
        "link",
        "members",
        "note",
        "priority",
        "project",
        "settings",
        "state",
        "template",
        "token",
        "unknown",
        "update",
        "webhook",
        "work-item",
        "worklog",
        "inbox",
      ],
      description: "Predefined asset key (horizontal-stack or illustration)",
    },
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the content wrapper",
    },
    rootClassName: {
      control: "text",
      description: "Additional CSS classes to apply to the root container",
    },
    assetClassName: {
      control: "text",
      description: "Additional CSS classes to apply to the asset",
    },
    asset: {
      control: false,
      description: "Custom React node to display as the visual asset (use this for full control instead of assetKey)",
    },
    actions: {
      control: false,
      description: "Array of action buttons to display",
    },
  },
};

export default meta;
type Story = StoryObj<BaseEmptyStateCommonProps>;

// Using assetKey (recommended approach)
export const WithAssetKey: Story = {
  args: {
    assetKey: "work-item",
    assetClassName: "size-20",
    title: "There're no progress metrics to show yet.",
  },
};

export const WithAssetKeyAndAction: Story = {
  args: {
    assetKey: "project",
    assetClassName: "size-20",
    title: "No projects found",
    actions: [
      {
        label: "Create Project",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
    ],
  },
};

export const WithAssetKeyAndMultipleActions: Story = {
  args: {
    assetKey: "members",
    assetClassName: "size-20",
    title: "Get started with your workspace",
    actions: [
      {
        label: "Create Project",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
      {
        label: "Import",
        onClick: () => console.log("import-clicked"),
        variant: "secondary",
      },
    ],
  },
};

// Using custom asset (legacy approach)
export const WithCustomAsset: Story = {
  args: {
    asset: (
      <svg className="h-40 w-40" viewBox="0 0 160 180" fill="none">
        <rect width="160" height="180" fill="#F3F4F6" rx="8" />
      </svg>
    ),
    title: "No items found",
    actions: [
      {
        label: "Create Item",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
    ],
  },
};

export const TitleOnly: Story = {
  args: {
    title: "No results found",
  },
};
