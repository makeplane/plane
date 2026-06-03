/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Popover } from "./popover";

const meta: Meta<typeof Popover> = {
  title: "Popover",
  component: Popover,
};

export default meta;

// types
type Story = StoryObj<typeof Popover>;

// data

// components
const RenderCustomPopoverComponent = (
  <div className="space-y-2">
    <div className="text-gray-500 text-13 font-medium">Your custom component</div>
    <div>
      {["option1", "option2", "option3"].map((option) => (
        <div
          key={option}
          className="text-gray-600 hover:text-gray-700 hover:bg-gray-200 cursor-pointer rounded-xs px-1.5 py-0.5 text-13 capitalize transition-all"
        >
          {option}
        </div>
      ))}
    </div>
  </div>
);

// stories
export const Default: Story = {
  args: {
    popperPosition: "bottom-start",
    panelClassName: "rounded-sm bg-gray-100 p-2",
    children: RenderCustomPopoverComponent,
  },
};

export const CustomMenuButton: Story = {
  args: {
    popperPosition: "bottom-start",
    button: (
      <div className="bg-gray-100 hover:bg-gray-200 rounded-sm p-2 text-13 font-medium transition-all">
        Custom Menu Button
      </div>
    ),
    panelClassName: "rounded-sm bg-gray-100 p-2",
    children: RenderCustomPopoverComponent,
  },
};
