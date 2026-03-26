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
import { Timer, EllipsisVertical } from "lucide-react";
import { WorklogBlock } from "./worklog-block";
import { TimelineTimestamp } from "../timeline/timeline-timestamp";
import { Avatar } from "@plane/propel/avatar";

const meta = preview.meta({
  title: "Activity/WorklogBlock",
  component: WorklogBlock,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    avatar: <Avatar name="Amanda" size={14} shape="square" />,
    ends: "bottom",
    children: (
      <>
        <span className="text-body-xs-medium text-primary">Amanda</span>
        <span className="text-body-xs-regular text-tertiary"> logged </span>
        <span className="text-body-xs-medium text-primary">2h 30m</span>
        <span className="text-body-xs-regular text-tertiary">.</span>
        <TimelineTimestamp timestamp="1 day ago" />
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] bg-surface-1 p-6">
        <Story />
      </div>
    ),
  ],
});

export const WithDescription = meta.story({
  args: {
    avatar: <Avatar name="Amanda" size={14} shape="square" />,
    ends: "bottom",
    children: (
      <>
        <span className="text-body-xs-medium text-primary">Amanda</span>
        <span className="text-body-xs-regular text-tertiary"> logged </span>
        <span className="text-body-xs-medium text-primary">4h 15m</span>
        <span className="text-body-xs-regular text-tertiary">.</span>
        <TimelineTimestamp timestamp="2 days ago" />
      </>
    ),
    description: (
      <span className="text-body-xs-regular text-secondary">
        Worked on the API integration for the new authentication flow. Resolved token refresh edge cases.
      </span>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] bg-surface-1 p-6">
        <Story />
      </div>
    ),
  ],
});

export const WithActions = meta.story({
  args: {
    avatar: <Avatar name="Ethan Parker" size={14} shape="square" />,
    ends: "bottom",
    children: (
      <>
        <span className="text-body-xs-medium text-primary">Ethan Parker</span>
        <span className="text-body-xs-regular text-tertiary"> logged </span>
        <span className="text-body-xs-medium text-primary">1h 00m</span>
        <span className="text-body-xs-regular text-tertiary">.</span>
        <TimelineTimestamp timestamp="3h ago" />
      </>
    ),
    actionsElement: (
      <button className="flex size-6 items-center justify-center rounded-md text-secondary hover:bg-layer-3">
        <EllipsisVertical className="size-3.5" />
      </button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] bg-surface-1 p-6">
        <Story />
      </div>
    ),
  ],
});

export const WithConnector = meta.story({
  args: {
    avatar: <Avatar name="Amanda" size={14} shape="square" />,
    showConnector: true,
    children: (
      <>
        <span className="text-body-xs-medium text-primary">Amanda</span>
        <span className="text-body-xs-regular text-tertiary"> logged </span>
        <span className="text-body-xs-medium text-primary">2h 30m</span>
        <span className="text-body-xs-regular text-tertiary">.</span>
        <TimelineTimestamp timestamp="1 day ago" />
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] bg-surface-1 p-6">
        <Story />
        <div className="h-6" />
      </div>
    ),
  ],
});

export const Highlighted = meta.story({
  args: {
    avatar: <Avatar name="Sarah Jones" size={14} shape="square" />,
    ends: "bottom",
    highlighted: true,
    children: (
      <>
        <span className="text-body-xs-medium text-primary">Sarah Jones</span>
        <span className="text-body-xs-regular text-tertiary"> logged </span>
        <span className="text-body-xs-medium text-primary">3h 45m</span>
        <span className="text-body-xs-regular text-tertiary">.</span>
        <TimelineTimestamp timestamp="just now" />
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] bg-surface-1 p-6">
        <Story />
      </div>
    ),
  ],
});

export const WithBadge = meta.story({
  args: {
    avatar: <Avatar name="Amanda" size={14} shape="square" />,
    badgeIcon: <Timer className="size-2.5 text-tertiary" />,
    ends: "bottom",
    children: (
      <>
        <span className="text-body-xs-medium text-primary">Amanda</span>
        <span className="text-body-xs-regular text-tertiary"> logged </span>
        <span className="text-body-xs-medium text-primary">2h 30m</span>
        <span className="text-body-xs-regular text-tertiary">.</span>
        <TimelineTimestamp timestamp="1 day ago" />
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] bg-surface-1 p-6">
        <Story />
      </div>
    ),
  ],
});
