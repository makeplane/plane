import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
import { PopoverMenu } from "./popover-menu";

const data = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Doe" },
  { id: 3, name: "John Smith" },
  { id: 4, name: "Jane Smith" },
];

const meta: Meta<typeof PopoverMenu<(typeof data)[number]>> = {
  title: "PopoverMenu",
  component: PopoverMenu,
  args: {
    data,
    popperPosition: "bottom-start",
    panelClassName: "rounded bg-gray-100 p-2",
    keyExtractor: (item, index) => `${item.id}-${index}`,
    render: (item) => (
      <div className="text-sm text-gray-600 hover:text-gray-700 rounded-sm cursor-pointer hover:bg-gray-200 transition-all px-1.5 py-0.5 capitalize">
        {item.name}
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
