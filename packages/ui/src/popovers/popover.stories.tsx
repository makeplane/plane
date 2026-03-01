/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./popover";

const meta = {
  title: "Popover",
  component: Popover,
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// data

// components
const RenderCustomPopoverComponent = (
  <div className="space-y-2">
    <div className="text-13 font-medium text-gray-500">Your custom component</div>
    <div>
      {["option1", "option2", "option3"].map((option) => (
        <div
          key={option}
          className="text-13 text-gray-600 hover:text-gray-700 rounded-xs cursor-pointer hover:bg-gray-200 transition-all px-1.5 py-0.5 capitalize"
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
      <div className="p-2 text-13 font-medium rounded-sm bg-gray-100 hover:bg-gray-200 transition-all">
        Custom Menu Button
      </div>
    ),
    panelClassName: "rounded-sm bg-gray-100 p-2",
    children: RenderCustomPopoverComponent,
  },
};
