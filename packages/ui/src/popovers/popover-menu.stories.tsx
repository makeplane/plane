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
import { PopoverMenu } from "./popover-menu";

type TPopoverMenu = {
  id: number;
  name: string;
};

const meta = {
  title: "Components/PopoverMenu",
  component: PopoverMenu,
  parameters: {
    layout: "centered",
  },
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
} satisfies Meta<typeof PopoverMenu<TPopoverMenu>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
