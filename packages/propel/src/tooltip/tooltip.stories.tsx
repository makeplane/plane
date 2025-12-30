import type { Meta, StoryObj } from "@storybook/react-vite";
import { HelpCircle } from "lucide-react";
import { Tooltip } from "./root";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tooltipContent: "This is a tooltip",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Hover me</button>,
  },
};

export const WithHeading: Story = {
  args: {
    tooltipHeading: "Tooltip Title",
    tooltipContent: "This is the tooltip content with a heading.",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Hover me</button>,
  },
};

export const PositionTop: Story = {
  args: {
    tooltipContent: "Tooltip on top",
    position: "top",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Top</button>,
  },
};

export const PositionBottom: Story = {
  args: {
    tooltipContent: "Tooltip on bottom",
    position: "bottom",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Bottom</button>,
  },
};

export const PositionLeft: Story = {
  args: {
    tooltipContent: "Tooltip on left",
    position: "left",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Left</button>,
  },
};

export const PositionRight: Story = {
  args: {
    tooltipContent: "Tooltip on right",
    position: "right",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Right</button>,
  },
};

export const WithIcon: Story = {
  args: {
    tooltipContent: "Click here for help",
    children: (
      <button className="rounded-full p-2 hover:bg-gray-100">
        <HelpCircle className="h-5 w-5 text-gray-600" />
      </button>
    ),
  },
};

export const Disabled: Story = {
  args: {
    tooltipContent: "This tooltip is disabled",
    disabled: true,
    children: <button className="rounded-sm bg-gray-400 px-4 py-2 text-on-color">Hover me (disabled)</button>,
  },
};

export const LongContent: Story = {
  args: {
    tooltipHeading: "Important Information",
    tooltipContent:
      "This is a longer tooltip with more detailed information that wraps to multiple lines. It provides comprehensive details about the element.",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Long content</button>,
  },
};

export const CustomDelay: Story = {
  args: {
    tooltipContent: "This tooltip has a custom delay",
    openDelay: 1000,
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Custom delay (1s)</button>,
  },
};

export const CustomOffset: Story = {
  args: {
    tooltipContent: "Custom offset tooltip",
    sideOffset: 20,
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Custom offset</button>,
  },
};

export const AllPositions: Story = {
  args: {
    children: <div />,
  },
  render() {
    return (
      <div className="flex flex-col items-center gap-4">
        <Tooltip tooltipContent="Top position" position="top">
          <button className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color">Top</button>
        </Tooltip>
        <div className="flex gap-4">
          <Tooltip tooltipContent="Left position" position="left">
            <button className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color">Left</button>
          </Tooltip>
          <Tooltip tooltipContent="Right position" position="right">
            <button className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color">Right</button>
          </Tooltip>
        </div>
        <Tooltip tooltipContent="Bottom position" position="bottom">
          <button className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color">Bottom</button>
        </Tooltip>
      </div>
    );
  },
};

export const OnText: Story = {
  args: {
    children: <div />,
  },
  render() {
    return (
      <p className="text-13 text-gray-700">
        This is some text with a{" "}
        <Tooltip tooltipContent="Additional information about this word" position="top">
          <span className="cursor-help border-b border-dashed border-blue-500 text-blue-500">tooltip</span>
        </Tooltip>{" "}
        in it.
      </p>
    );
  },
};

export const OnDisabledButton: Story = {
  args: {
    children: <div />,
  },
  render() {
    return (
      <Tooltip tooltipContent="This feature is currently unavailable" position="top">
        <button className="cursor-not-allowed rounded-sm bg-gray-300 px-4 py-2 text-gray-500" disabled>
          Disabled Button
        </button>
      </Tooltip>
    );
  },
};

export const ComplexContent: Story = {
  args: {
    tooltipHeading: "User Information",
    tooltipContent: (
      <div className="space-y-1">
        <p className="font-semibold">John Doe</p>
        <p className="text-11">john@example.com</p>
        <p className="text-11 text-gray-400">Last seen: 2 hours ago</p>
      </div>
    ),
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">View User</button>,
  },
};

export const WithCustomStyling: Story = {
  args: {
    tooltipContent: "Custom styled tooltip",
    className: "bg-purple-500 text-on-color",
    children: <button className="rounded-sm bg-purple-500 px-4 py-2 text-on-color">Custom style</button>,
  },
};

export const MultipleTooltips: Story = {
  args: {
    children: <div />,
  },
  render() {
    return (
      <div className="flex gap-4">
        <Tooltip tooltipContent="Save your work" position="top">
          <button className="rounded-sm bg-green-500 px-4 py-2 text-13 text-on-color">Save</button>
        </Tooltip>
        <Tooltip tooltipContent="Discard changes" position="top">
          <button className="rounded-sm bg-red-500 px-4 py-2 text-13 text-on-color">Cancel</button>
        </Tooltip>
        <Tooltip tooltipContent="Export to PDF" position="top">
          <button className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color">Export</button>
        </Tooltip>
        <Tooltip tooltipContent="Share with team" position="top">
          <button className="rounded-sm bg-purple-500 px-4 py-2 text-13 text-on-color">Share</button>
        </Tooltip>
      </div>
    );
  },
};

export const IconButtons: Story = {
  args: {
    children: <div />,
  },
  render() {
    return (
      <div className="flex gap-2">
        <Tooltip tooltipContent="Edit" position="top">
          <button className="rounded-sm p-2 hover:bg-gray-100">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </Tooltip>
        <Tooltip tooltipContent="Delete" position="top">
          <button className="rounded-sm p-2 hover:bg-gray-100">
            <svg
              className="h-5 w-5 text-danger-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </Tooltip>
        <Tooltip tooltipContent="Share" position="top">
          <button className="rounded-sm p-2 hover:bg-gray-100">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </Tooltip>
      </div>
    );
  },
};

export const InFormField: Story = {
  args: {
    children: <div />,
  },
  render() {
    return (
      <div className="w-80">
        <label className="mb-1 flex items-center gap-2 text-13 font-medium text-gray-700">
          Email Address
          <Tooltip
            tooltipHeading="Email Requirements"
            tooltipContent="Enter a valid email address that you have access to. We'll send a verification link."
            position="right"
          >
            <HelpCircle className="h-4 w-4 cursor-help text-gray-400" />
          </Tooltip>
        </label>
        <input
          type="email"
          className="w-full rounded-sm border border-gray-300 px-3 py-2 text-13"
          placeholder="you@example.com"
        />
      </div>
    );
  },
};
