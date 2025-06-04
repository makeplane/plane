import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
import { Popover } from "./popover";

const meta: Meta<typeof Popover> = {
  title: "Popover",
  component: Popover,
  args: {
    popperPosition: "bottom-start",
    panelClassName: "rounded bg-gray-100 p-2",
    children: (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-500">Your custom component</div>
        <div>
          {["option1", "option2", "option3"].map((option) => (
            <div
              key={option}
              className="text-sm text-gray-600 hover:text-gray-700 rounded-sm cursor-pointer hover:bg-gray-200 transition-all px-1.5 py-0.5 capitalize"
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomMenuButton: Story = {
  args: {
    button: (
      <div className="p-2 text-sm font-medium rounded bg-gray-100 hover:bg-gray-200 transition-all">
        Custom Menu Button
      </div>
    ),
  },
};
