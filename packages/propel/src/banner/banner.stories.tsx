import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner } from "./banner";

const meta = {
  title: "Components/Banner",
  component: Banner,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "error", "warning", "info"],
      description: "Visual variant of the banner",
    },
    title: {
      control: "text",
      description: "Banner message text",
    },
    icon: {
      control: false,
      description: "Icon element to display before the title",
    },
    action: {
      control: false,
      description: "Action element(s) to display on the right side",
    },
  },
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample icons for different variants
function SuccessIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-success-primary"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-danger-primary"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-yellow-600"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-600"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CloseButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      aria-label="Dismiss"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-text-secondary"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

// ============================================================================
// Interactive Stories
// ============================================================================

export const Interactive: Story = {
  args: {
    variant: "info",
    title: "This is an interactive banner. Use the controls to customize it.",
    icon: <InfoIcon />,
    dismissible: true,
  },
};

// ============================================================================
// Main Variants
// ============================================================================

export const Success: Story = {
  args: {
    variant: "success",
    title: "Operation completed successfully",
    icon: <SuccessIcon />,
    action: <CloseButton />,
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "An error occurred while processing your request",
    icon: <ErrorIcon />,
    action: <CloseButton />,
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Your session will expire in 5 minutes",
    icon: <WarningIcon />,
    action: <CloseButton />,
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    title: "New features are available. Check out what's new!",
    icon: <InfoIcon />,
    action: <CloseButton />,
  },
};
