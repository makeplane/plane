import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";
import { ComicBoxButton } from "./comic-box-button";

const meta: Meta<typeof ComicBoxButton> = {
  title: "Core/Components/Buttons/ComicBoxButton",
  component: ComicBoxButton,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Button label text",
    },
    title: {
      control: "text",
      description: "Tooltip title",
    },
    description: {
      control: "text",
      description: "Tooltip description",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComicBoxButton>;

export const Default: Story = {
  args: {
    label: "Create Project",
    title: "Start your first project",
    description: "Create a project to organize your work and collaborate with your team.",
    icon: <Plus className="h-4 w-4" />,
  },
};

export const WithoutIcon: Story = {
  args: {
    label: "Add Members",
    title: "Invite team members",
    description: "Collaborate with your team by inviting them to join your workspace.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Create Project",
    title: "Start your first project",
    description: "Create a project to organize your work and collaborate with your team.",
    icon: <Plus className="h-4 w-4" />,
    disabled: true,
  },
};

export const LongContent: Story = {
  args: {
    label: "A Very Long Button Label That Might Need to Wrap",
    title: "This is a very long title that demonstrates how the component handles long content",
    description: "This is a detailed description that contains multiple sentences to show how the tooltip handles longer content. It should wrap properly and maintain readability.",
    icon: <Plus className="h-4 w-4" />,
  },
};
