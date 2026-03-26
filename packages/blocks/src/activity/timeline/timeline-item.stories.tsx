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
import { ArrowUpRight, Circle, Tag, User } from "lucide-react";
import { TimelineItem } from "./timeline-item";
import { TimelineContainer } from "./timeline-container";
import { TimelineItemIcon } from "./timeline-item-icon";
import { TimelineConnector } from "./timeline-connector";

const meta = preview.meta({
  title: "Activity/TimelineItem",
  component: TimelineItem,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    icon: <Circle className="size-3.5 text-tertiary" />,
    children: (
      <>
        <span className="text-body-xs-medium text-primary whitespace-nowrap">Amanda</span>
        <span className="text-body-xs-regular text-tertiary whitespace-nowrap">changed the state to</span>
        <span className="text-body-xs-medium text-primary whitespace-nowrap">In Progress</span>
      </>
    ),
    timestamp: "2h ago",
    showConnector: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const WithoutConnector = meta.story({
  args: {
    icon: <Tag className="size-3.5 text-tertiary" />,
    children: (
      <>
        <span className="text-body-xs-medium text-primary whitespace-nowrap">Ethan Parker</span>
        <span className="text-body-xs-regular text-tertiary whitespace-nowrap">added the label</span>
        <span className="text-body-xs-medium text-primary whitespace-nowrap">Bug</span>
      </>
    ),
    timestamp: "5h ago",
    showConnector: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const SmallConnector = meta.story({
  args: {
    icon: <ArrowUpRight className="size-3.5 text-tertiary" />,
    children: (
      <>
        <span className="text-body-xs-medium text-primary whitespace-nowrap">Sarah Jones</span>
        <span className="text-body-xs-regular text-tertiary whitespace-nowrap">changed priority to</span>
        <span className="text-body-xs-medium text-primary whitespace-nowrap">High</span>
      </>
    ),
    timestamp: "1d ago",
    showConnector: true,
    connectorHeight: "sm",
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const MultipleItems = meta.story({
  args: {
    icon: <Circle className="size-3.5 text-tertiary" />,
    children: (
      <>
        <span className="text-body-xs-medium text-primary whitespace-nowrap">Amanda</span>
        <span className="text-body-xs-regular text-tertiary whitespace-nowrap">created the issue</span>
      </>
    ),
    timestamp: "3h ago",
  },
  decorators: [
    () => (
      <div className="w-[757px] bg-surface-1 p-4">
        <TimelineContainer>
          <TimelineItem icon={<User className="size-3.5 text-tertiary" />} timestamp="3h ago">
            <span className="text-body-xs-medium text-primary whitespace-nowrap">Amanda</span>
            <span className="text-body-xs-regular text-tertiary whitespace-nowrap">changed assignee to</span>
            <span className="text-body-xs-medium text-primary whitespace-nowrap">John Miller</span>
          </TimelineItem>
          <TimelineItem icon={<Circle className="size-3.5 text-tertiary" />} timestamp="2h ago">
            <span className="text-body-xs-medium text-primary whitespace-nowrap">Ethan Parker</span>
            <span className="text-body-xs-regular text-tertiary whitespace-nowrap">changed state to</span>
            <span className="text-body-xs-medium text-primary whitespace-nowrap">In Progress</span>
          </TimelineItem>
          <TimelineItem icon={<Tag className="size-3.5 text-tertiary" />} timestamp="1h ago" showConnector={false}>
            <span className="text-body-xs-medium text-primary whitespace-nowrap">Sarah Jones</span>
            <span className="text-body-xs-regular text-tertiary whitespace-nowrap">added label</span>
            <span className="text-body-xs-medium text-primary whitespace-nowrap">Feature</span>
          </TimelineItem>
        </TimelineContainer>
      </div>
    ),
  ],
});

export const IconBoxPrimitive = meta.story({
  render: () => (
    <div className="flex gap-4 bg-surface-1 p-4">
      <TimelineItemIcon>
        <Circle className="size-3.5 text-tertiary" />
      </TimelineItemIcon>
      <TimelineItemIcon>
        <Tag className="size-3.5 text-tertiary" />
      </TimelineItemIcon>
      <TimelineItemIcon>
        <User className="size-3.5 text-tertiary" />
      </TimelineItemIcon>
    </div>
  ),
});

export const ConnectorVariants = meta.story({
  render: () => (
    <div className="flex gap-8 bg-surface-1 p-4">
      <div className="flex flex-col items-center">
        <TimelineItemIcon>
          <Circle className="size-3.5 text-tertiary" />
        </TimelineItemIcon>
        <TimelineConnector size="md" />
        <span className="text-caption-sm-regular text-tertiary">md (24px)</span>
      </div>
      <div className="flex flex-col items-center">
        <TimelineItemIcon>
          <Circle className="size-3.5 text-tertiary" />
        </TimelineItemIcon>
        <TimelineConnector size="sm" />
        <span className="text-caption-sm-regular text-tertiary">sm (8px)</span>
      </div>
    </div>
  ),
});
