import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pill, EPillVariant, EPillSize } from "./pill";

const meta = {
  title: "Components/Pill",
  component: Pill,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Default",
  },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: {
    variant: EPillVariant.PRIMARY,
    children: "Primary",
  },
};

export const Success: Story = {
  args: {
    variant: EPillVariant.SUCCESS,
    children: "Success",
  },
};

export const Warning: Story = {
  args: {
    variant: EPillVariant.WARNING,
    children: "Warning",
  },
};

export const Error: Story = {
  args: {
    variant: EPillVariant.ERROR,
    children: "Error",
  },
};

export const Info: Story = {
  args: {
    variant: EPillVariant.INFO,
    children: "Info",
  },
};

export const Small: Story = {
  args: {
    size: EPillSize.SM,
    children: "Small",
  },
};

export const Medium: Story = {
  args: {
    size: EPillSize.MD,
    children: "Medium",
  },
};

export const Large: Story = {
  args: {
    size: EPillSize.LG,
    children: "Large",
  },
};

export const AllVariants: Story = {
  render() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Pill variant={EPillVariant.DEFAULT}>Default</Pill>
          <Pill variant={EPillVariant.PRIMARY}>Primary</Pill>
          <Pill variant={EPillVariant.SUCCESS}>Success</Pill>
          <Pill variant={EPillVariant.WARNING}>Warning</Pill>
          <Pill variant={EPillVariant.ERROR}>Error</Pill>
          <Pill variant={EPillVariant.INFO}>Info</Pill>
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
          <Pill size={EPillSize.SM}>Small</Pill>
          <Pill size={EPillSize.MD}>Medium</Pill>
          <Pill size={EPillSize.LG}>Large</Pill>
        </div>
      </div>
    );
  },
};

export const WithNumbers: Story = {
  render() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Pill variant={EPillVariant.PRIMARY}>3</Pill>
          <Pill variant={EPillVariant.SUCCESS}>12</Pill>
          <Pill variant={EPillVariant.WARNING}>99+</Pill>
          <Pill variant={EPillVariant.ERROR}>!</Pill>
        </div>
      </div>
    );
  },
};

export const StatusExamples: Story = {
  render() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-13 font-medium">Task Status</h3>
          <div className="flex flex-wrap gap-2">
            <Pill variant={EPillVariant.DEFAULT}>Draft</Pill>
            <Pill variant={EPillVariant.WARNING}>In Progress</Pill>
            <Pill variant={EPillVariant.INFO}>In Review</Pill>
            <Pill variant={EPillVariant.SUCCESS}>Completed</Pill>
            <Pill variant={EPillVariant.ERROR}>Blocked</Pill>
          </div>
        </div>
      </div>
    );
  },
};
