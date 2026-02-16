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

import { MilestoneIcon } from "./milestone";

// Milestone variant colors (matching utils package)
const MILESTONE_COLORS = {
  default: "#455068",
  done: "#1FAD40",
  in_progress: "#004EFF",
  not_started_yet: "#FF0000",
  started_no_progress: "#FF9500",
} as const;

const meta = {
  title: "Icons/MilestoneIcon",
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
} satisfies Meta<typeof MilestoneIcon>;

export default meta;
type Story = StoryObj<typeof MilestoneIcon>;

export const AllVariants: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-1">
        <MilestoneIcon {...args} fill={MILESTONE_COLORS.default} />
        <span className="text-xs text-neutral-500">default</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <MilestoneIcon {...args} fill={MILESTONE_COLORS.in_progress} />
        <span className="text-xs text-neutral-500">in_progress (1-99%)</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <MilestoneIcon {...args} fill={MILESTONE_COLORS.started_no_progress} />
        <span className="text-xs text-neutral-500">started_no_progress</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <MilestoneIcon {...args} fill={MILESTONE_COLORS.not_started_yet} />
        <span className="text-xs text-neutral-500">not_started_yet (0%)</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <MilestoneIcon {...args} fill={MILESTONE_COLORS.done} isDone />
        <span className="text-xs text-neutral-500">done (100%)</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <MilestoneIcon {...args} fill={MILESTONE_COLORS.in_progress} isSolid />
        <span className="text-xs text-neutral-500">in_progress (1-99%) - solid</span>
      </div>
    </div>
  ),
};

export const Default: Story = {
  args: { fill: MILESTONE_COLORS.default },
};

export const InProgress: Story = {
  args: { fill: MILESTONE_COLORS.in_progress },
};

export const StartedNoProgress: Story = {
  args: { fill: MILESTONE_COLORS.started_no_progress },
};

export const NotStartedYet: Story = {
  args: { fill: MILESTONE_COLORS.not_started_yet },
};

export const Done: Story = {
  args: { fill: MILESTONE_COLORS.done, isDone: true },
};
