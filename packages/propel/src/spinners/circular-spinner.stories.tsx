import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./circular-spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    height: "32px",
    width: "32px",
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    height: "16px",
    width: "16px",
  },
};

export const Medium: Story = {
  args: {
    height: "24px",
    width: "24px",
  },
};

export const Large: Story = {
  args: {
    height: "48px",
    width: "48px",
  },
};

export const ExtraLarge: Story = {
  args: {
    height: "64px",
    width: "64px",
  },
};

export const CustomColor: Story = {
  args: {
    className: "text-blue-500",
  },
};

export const AllSizes: Story = {
  render() {
    return (
      <div className="flex items-center gap-6">
        <div className="text-center">
          <Spinner height="16px" width="16px" />
          <p className="mt-2 text-11 text-gray-600">Small</p>
        </div>
        <div className="text-center">
          <Spinner height="24px" width="24px" />
          <p className="mt-2 text-11 text-gray-600">Medium</p>
        </div>
        <div className="text-center">
          <Spinner height="32px" width="32px" />
          <p className="mt-2 text-11 text-gray-600">Default</p>
        </div>
        <div className="text-center">
          <Spinner height="48px" width="48px" />
          <p className="mt-2 text-11 text-gray-600">Large</p>
        </div>
        <div className="text-center">
          <Spinner height="64px" width="64px" />
          <p className="mt-2 text-11 text-gray-600">XL</p>
        </div>
      </div>
    );
  },
};

export const ColorVariations: Story = {
  render() {
    return (
      <div className="flex items-center gap-6">
        <div className="text-center">
          <Spinner className="text-blue-500" />
          <p className="mt-2 text-11 text-gray-600">Blue</p>
        </div>
        <div className="text-center">
          <Spinner className="text-success-primary" />
          <p className="mt-2 text-11 text-gray-600">Green</p>
        </div>
        <div className="text-center">
          <Spinner className="text-danger-primary" />
          <p className="mt-2 text-11 text-gray-600">Red</p>
        </div>
        <div className="text-center">
          <Spinner className="text-purple-500" />
          <p className="mt-2 text-11 text-gray-600">Purple</p>
        </div>
        <div className="text-center">
          <Spinner className="text-orange-500" />
          <p className="mt-2 text-11 text-gray-600">Orange</p>
        </div>
      </div>
    );
  },
};

export const InButton: Story = {
  render() {
    return (
      <button className="flex items-center gap-2 rounded-sm bg-blue-500 px-4 py-2 text-on-color">
        <Spinner height="16px" width="16px" />
        <span>Loading...</span>
      </button>
    );
  },
};

export const CenteredInCard: Story = {
  render() {
    return (
      <div className="w-96 rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Spinner height="48px" width="48px" />
          <p className="text-13 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  },
};
