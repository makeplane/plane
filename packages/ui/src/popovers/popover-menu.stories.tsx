import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { PopoverMenu } from "./popover-menu";

type TPopoverMenu = {
  id: number;
  name: string;
};

const meta: Meta<typeof PopoverMenu<TPopoverMenu>> = {
  title: "Components/PopoverMenu",
  component: PopoverMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    popperPosition: "bottom-start",
    panelClassName: "rounded-sm bg-gray-100 p-2",
    data: [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Doe" },
      { id: 3, name: "John Smith" },
      { id: 4, name: "Jane Smith" },
    ],
    keyExtractor: (item, index: number) => `${item.id}-${index}`,
    render: (item: TPopoverMenu) => (
      <div className="text-13 text-gray-600 hover:text-gray-700 rounded-xs cursor-pointer hover:bg-gray-200 transition-all px-1.5 py-0.5 capitalize">
        {item.name}
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof PopoverMenu<TPopoverMenu>>;

export const Default: Story = {};
