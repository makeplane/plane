import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    return (
      <div className="w-[300px] space-y-4">
        <div>Content Above</div>
        <Separator />
        <div>Content Below</div>
      </div>
    );
  },
};

export const Vertical: Story = {
  render() {
    return (
      <div className="flex h-[100px] items-center space-x-4">
        <div>Left Content</div>
        <Separator orientation="vertical" />
        <div>Right Content</div>
      </div>
    );
  },
};

export const WithinContainer: Story = {
  render() {
    return (
      <div className="w-[300px] rounded-lg border p-6 space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Section 1</h4>
          <p className="text-13 text-muted-foreground">Description for section 1</p>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Section 2</h4>
          <p className="text-13 text-muted-foreground">Description for section 2</p>
        </div>
      </div>
    );
  },
};
