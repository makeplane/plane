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
import { Sortable } from "./sortable";

type StoryItem = { id: string; name: string };

const meta = {
  title: "Sortable",
  component: Sortable,
  args: {
    data: [
      { id: "1", name: "John Doe" },
      { id: "2", name: "Satish" },
      { id: "3", name: "Alice" },
      { id: "4", name: "Bob" },
      { id: "5", name: "Charlie" },
    ],
    render: (item: StoryItem) => (
      // <Draggable data={item} className="rounded-lg">
      <div className="border ">{item.name}</div>
      // </Draggable>
    ),
    onChange: (data) => console.log(data.map(({ id }) => id)),
    keyExtractor: (item) => item.id,
  },
} satisfies Meta<typeof Sortable<StoryItem>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
