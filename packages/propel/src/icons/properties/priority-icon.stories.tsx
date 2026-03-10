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
import { PriorityPropertyIcon } from "./priority-icon";

const meta = preview.meta({
  title: "Media/Icons/Priority",
  component: PriorityPropertyIcon,
  parameters: {
    layout: "centered",
  },
});

export const Default = meta.story({
  args: {},
});

export const CustomColor = meta.story({
  args: { color: "#ef4444" },
});

export const AllSizes = meta.story({
  args: {},
  render(_args) {
    return (
      <div className="flex items-end gap-4">
        <PriorityPropertyIcon className="size-3" />
        <PriorityPropertyIcon className="size-4" />
        <PriorityPropertyIcon className="size-5" />
        <PriorityPropertyIcon className="size-6" />
        <PriorityPropertyIcon className="size-8" />
      </div>
    );
  },
});
