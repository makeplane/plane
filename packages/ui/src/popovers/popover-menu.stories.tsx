import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PopoverMenu } from "./popover-menu";

const meta: Meta<typeof PopoverMenu> = {
  title: "PopoverMenu",
  component: PopoverMenu,
};

export default meta;

// types
type TPopoverMenu = {
  id: number;
  name: string;
};

type Story = StoryObj<typeof PopoverMenu<TPopoverMenu>>;

// data
const data: TPopoverMenu[] = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Doe" },
  { id: 3, name: "John Smith" },
  { id: 4, name: "Jane Smith" },
];

// components
const PopoverMenuItemRender = (item: TPopoverMenu) => (
  <div className="text-sm text-gray-600 hover:text-gray-700 rounded-sm cursor-pointer hover:bg-gray-200 transition-all px-1.5 py-0.5 capitalize">
    {item.name}
  </div>
);

// stories
export const Default: Story = {
  args: {
    popperPosition: "bottom-start",
    panelClassName: "rounded bg-gray-100 p-2",
    data: data,
    keyExtractor: (item, index: number) => `${item.id}-${index}`,
    render: (item) => PopoverMenuItemRender(item),
  },
};
