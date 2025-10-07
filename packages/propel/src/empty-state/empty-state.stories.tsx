import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkItemHorizontalStackIllustration } from "./assets/horizontal-stack";
import { HorizontalStackAssetsMap } from "./assets/horizontal-stack/constant";
import { WorkItemVerticalStackIllustration } from "./assets/vertical-stack";
import { VerticalStackAssetsMap } from "./assets/vertical-stack/constant";
import { EmptyState, type EmptyStateProps } from "./empty-state";

const meta: Meta<EmptyStateProps> = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible empty state component that can display an asset, title, description, and action buttons.",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description: "The main title text for the empty state",
    },
    description: {
      control: "text",
      description: "Optional description text that appears below the title",
    },
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the root element",
    },
    type: {
      control: "select",
      options: ["detailed", "simple"],
      description: "The layout type of the empty state",
    },
    asset: {
      control: false,
      description: "React node to display as the visual asset (icon, illustration, etc.)",
    },
    actions: {
      control: false,
      description: "Array of action buttons to display",
    },
  },
};

export default meta;
type Story = StoryObj<EmptyStateProps>;

export const Default: Story = {
  args: {
    asset: <WorkItemVerticalStackIllustration className="w-40 h-45" />,
    title: "Create an epic and split work into smaller goals",
    description: "For larger bodies of work that span several cycles and can live across modules, create an epic.",
    actions: [
      {
        label: "Create an Epic",
        onClick: () => console.log("primary-action-clicked"),
        variant: "primary",
      },
    ],
  },
};

export const Simple: Story = {
  args: {
    asset: <WorkItemHorizontalStackIllustration className="w-40 h-45" />,
    title: "There're no progress metrics to show yet.",
    description: "For larger bodies of work that span several cycles and can live across modules, create an epic.",
    type: "simple",
  },
};

export const HorizontalStackAssets: Story = {
  render: () => (
    <div className="grid grid-cols-12 gap-6 w-full">
      {HorizontalStackAssetsMap.map((item) => (
        <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-3">
          {item.asset}
          <p className="text-sm text-custom-text-200 text-right">{item.title}</p>
        </div>
      ))}
    </div>
  ),
};

export const VerticalStackAssets: Story = {
  render: () => (
    <div className="grid grid-cols-12 gap-6 w-full py-20">
      {VerticalStackAssetsMap.map((item) => (
        <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-3">
          {item.asset}
          <p className="text-sm text-custom-text-200">{item.title}</p>
        </div>
      ))}
    </div>
  ),
};
