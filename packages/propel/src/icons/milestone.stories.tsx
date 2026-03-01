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
import { MilestoneIcon } from "./milestone";

// Milestone variant colors (matching utils package)
const MILESTONE_COLORS = {
  default: "#455068",
  done: "#1FAD40",
  in_progress: "#004EFF",
  not_started_yet: "#FF0000",
  started_no_progress: "#FF9500",
} as const;

const meta = preview.meta({
  component: MilestoneIcon,
  argTypes: {
    fill: {
      control: "color",
    },
    isDone: {
      control: "boolean",
    },
    className: {
      control: "text",
    },
  },
  args: {
    className: "size-6",
  },
});

export const Default = meta.story({
  args: { fill: MILESTONE_COLORS.default },
});

export const InProgress = meta.story({
  args: { fill: MILESTONE_COLORS.in_progress },
});

export const StartedNoProgress = meta.story({
  args: { fill: MILESTONE_COLORS.started_no_progress },
});

export const NotStartedYet = meta.story({
  args: { fill: MILESTONE_COLORS.not_started_yet },
});

export const Done = meta.story({
  args: { fill: MILESTONE_COLORS.done, isDone: true },
});

export const Solid = meta.story({
  args: { fill: MILESTONE_COLORS.in_progress, isSolid: true },
});

export const NoFill = meta.story({
  args: {},
});
