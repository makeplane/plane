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

import preview from "#.storybook/preview";
import { Tag } from "lucide-react";
import { LabelPropertyIcon, PriorityPropertyIcon, ParentPropertyIcon } from "@plane/propel/icons";
import { CollapsedGroup } from "./collapsed-group";

const meta = preview.meta({
  title: "Activity/CollapsedGroup",
  component: CollapsedGroup,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    icons: [
      <PriorityPropertyIcon key="0" className="size-3.5 text-tertiary" />,
      <ParentPropertyIcon key="1" className="size-3.5 text-tertiary" />,
      <Tag key="2" className="size-3.5 text-tertiary" />,
    ],
    count: 10,
    onExpand: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const TwoIcons = meta.story({
  args: {
    icons: [
      <PriorityPropertyIcon key="0" className="size-3.5 text-tertiary" />,
      <LabelPropertyIcon key="1" className="size-3.5 text-tertiary" />,
    ],
    count: 5,
    onExpand: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const SingleIcon = meta.story({
  args: {
    icons: [<PriorityPropertyIcon key="0" className="size-3.5 text-tertiary" />],
    count: 3,
    onExpand: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});
