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
import { CalendarDays } from "lucide-react";
import { PriorityPropertyIcon, StatePropertyIcon } from "@plane/propel/icons";
import { TransitionRow } from "./transition-row";
import { TimelineItem } from "../timeline/timeline-item";
import { TimelineConnector } from "../timeline/timeline-connector";
import { TimelineTimestamp } from "../timeline/timeline-timestamp";

const meta = preview.meta({
  title: "Activity/TransitionRow",
  component: TransitionRow,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    oldValue: {
      icon: <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "Backlog",
    },
    newValue: {
      icon: <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "In Progress",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const WithTimelineItem = meta.story({
  args: {
    oldValue: {
      icon: <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "Backlog",
    },
    newValue: {
      icon: <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "To do",
    },
  },
  render: (args) => (
    <div className="w-[757px] bg-surface-1 p-4">
      <div>
        <TimelineItem
          icon={<StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />}
          showConnector={false}
          className="text-caption-sm-regular"
        >
          <span className="flex gap-1.5 w-full truncate text-secondary">
            <span className="font-medium text-primary">Amanda</span>
            <TimelineTimestamp timestamp="1 day ago" />
          </span>
        </TimelineItem>
        <TransitionRow {...args} />
        <TimelineConnector size="md" />
      </div>
    </div>
  ),
});

export const PriorityTransition = meta.story({
  args: {
    oldValue: {
      icon: <PriorityPropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "None",
    },
    newValue: {
      icon: <PriorityPropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "High",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const DateTransition = meta.story({
  args: {
    oldValue: {
      icon: <CalendarDays className="h-3.5 w-3.5 text-secondary" />,
      label: "15 Jan, 2026",
    },
    newValue: {
      icon: <CalendarDays className="h-3.5 w-3.5 text-secondary" />,
      label: "28 Feb, 2026",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const EmptyOldValue = meta.story({
  args: {
    oldValue: {
      icon: <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "None",
      isEmpty: true,
    },
    newValue: {
      icon: <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "In Progress",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const WithActivityMessage = meta.story({
  args: {
    oldValue: {
      icon: <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "Backlog",
    },
    newValue: {
      icon: <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />,
      label: "In Progress",
    },
  },
  render: (args) => (
    <div className="w-[757px] bg-surface-1 p-4">
      <div className="flex flex-col">
        <TimelineItem icon={<StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />} showConnector={false}>
          <span className="text-body-xs-medium text-primary">Amanda</span>
          <span className="text-body-xs-regular text-tertiary"> set the state to </span>
          <span className="text-body-xs-medium text-primary">In Progress</span>
          <TimelineTimestamp timestamp="1 day ago" />
        </TimelineItem>
        <TimelineConnector size="sm" />
        <TransitionRow {...args} />
        <TimelineConnector size="md" />
      </div>
    </div>
  ),
});
