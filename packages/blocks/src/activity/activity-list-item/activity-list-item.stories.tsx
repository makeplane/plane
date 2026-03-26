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
import { AlignLeft, CalendarDays, Link, Paperclip, RotateCcw } from "lucide-react";
import {
  LabelPropertyIcon,
  MembersPropertyIcon,
  ParentPropertyIcon,
  PriorityPropertyIcon,
  StatePropertyIcon,
  WorkItemsIcon,
} from "@plane/propel/icons";
import { ActivityListItem } from "./activity-list-item";
import type { ActivityItemData } from "../types";

const meta = preview.meta({
  title: "Activity/ActivityListItem",
  component: ActivityListItem,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-[600px] bg-surface-1 p-6">
        <Story />
      </div>
    ),
  ],
});

// --- Helper to build actor links ---

const actorLink = (name: string) => (
  <a href="#" className="font-medium text-primary hover:underline">
    {name}
  </a>
);

const actorSpan = (name: string) => <span className="font-medium text-primary">{name}</span>;

// --- Default (work item created) ---

export const Default = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "1 day ago",
      tooltipTimestamp: "22 Mar, 2026, 10:30 AM",
      icon: <WorkItemsIcon className="size-3.5" />,
      customContent: <>created the work item.</>,
    } satisfies ActivityItemData,
  },
});

// --- State change ---

export const StateChange = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "1 day ago",
      icon: <StatePropertyIcon className="size-3.5" />,
      customContent: (
        <>
          set the state to <span className="font-medium text-primary">In Progress</span>.
        </>
      ),
    },
  },
});

// --- Priority change ---

export const PriorityChange = meta.story({
  args: {
    data: {
      actor: actorLink("Ethan Parker"),
      timestamp: "1 day ago",
      icon: <PriorityPropertyIcon className="size-3.5" />,
      customContent: (
        <>
          set the priority to <span className="font-medium text-primary">High</span>.
        </>
      ),
    },
  },
});

// --- Assignee added/removed ---

export const AssigneeAdded = meta.story({
  args: {
    data: {
      actor: actorLink("Ethan Parker"),
      timestamp: "1 day ago",
      icon: <MembersPropertyIcon className="size-3.5" />,
      customContent: (
        <>
          added <span className="font-medium text-primary">John Miller</span> as an assignee.
        </>
      ),
    },
  },
});

export const AssigneeRemoved = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "2 days ago",
      icon: <MembersPropertyIcon className="size-3.5" />,
      customContent: (
        <>
          removed <span className="font-medium text-primary">Sarah Jones</span> from assignees.
        </>
      ),
    },
  },
});

// --- Label added/removed ---

export const LabelAdded = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "3 hours ago",
      icon: <LabelPropertyIcon className="size-3.5" />,
      customContent: (
        <>
          added the label <span className="font-medium text-primary">Bug</span>.
        </>
      ),
    },
  },
});

export const LabelRemoved = meta.story({
  args: {
    data: {
      actor: actorLink("Ethan Parker"),
      timestamp: "5 hours ago",
      icon: <LabelPropertyIcon className="size-3.5" />,
      customContent: (
        <>
          removed the label <span className="font-medium text-primary">Feature</span>.
        </>
      ),
    },
  },
});

// --- Date fields ---

export const StartDateSet = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "1 day ago",
      icon: <CalendarDays className="size-3.5" />,
      customContent: (
        <>
          set the start date to <span className="font-medium text-primary">24 Nov, 2025</span>.
        </>
      ),
    },
  },
});

export const DueDateSet = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "1 day ago",
      icon: <CalendarDays className="size-3.5" />,
      customContent: (
        <>
          set the due date to <span className="font-medium text-primary">30 Dec, 2025</span>.
        </>
      ),
    },
  },
});

// --- Description ---

export const DescriptionUpdated = meta.story({
  args: {
    data: {
      actor: actorLink("Ethan Parker"),
      timestamp: "6 hours ago",
      icon: <AlignLeft className="size-3.5" />,
      customContent: <>updated the description.</>,
    },
  },
});

// --- Attachment ---

export const AttachmentAdded = meta.story({
  args: {
    data: {
      actor: actorLink("Sarah Jones"),
      timestamp: "2 hours ago",
      icon: <Paperclip className="size-3.5" />,
      customContent: <>added an attachment.</>,
    },
  },
});

// --- Link ---

export const LinkAdded = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "4 hours ago",
      icon: <Link className="size-3.5" />,
      customContent: <>added a link.</>,
    },
  },
});

// --- Parent ---

export const ParentSet = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "1 day ago",
      icon: <ParentPropertyIcon className="size-3.5" />,
      customContent: (
        <>
          set the parent to <span className="font-medium text-primary">PROJ-42</span>.
        </>
      ),
    },
  },
});

export const ParentRemoved = meta.story({
  args: {
    data: {
      actor: actorLink("Ethan Parker"),
      timestamp: "8 hours ago",
      icon: <ParentPropertyIcon className="size-3.5" />,
      customContent: (
        <>
          removed the parent <span className="font-medium text-primary">PROJ-42</span>.
        </>
      ),
    },
  },
});

// --- Cycle / Module (with customContent) ---

export const CycleAdded = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "1 day ago",
      icon: <RotateCcw className="size-3.5" />,
      customContent: (
        <>
          <span>added this work item to the cycle </span>
          <a href="#" className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline">
            <span className="truncate">Sprint 12</span>
          </a>
        </>
      ),
    },
  },
});

export const ModuleAdded = meta.story({
  args: {
    data: {
      actor: actorLink("Ethan Parker"),
      timestamp: "2 days ago",
      customContent: (
        <>
          <span>added this work item to the module </span>
          <a href="#" className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline">
            <span className="truncate">Authentication</span>
          </a>
        </>
      ),
    },
  },
});

// --- Archived / Restored ---

export const ArchivedAt = meta.story({
  args: {
    data: {
      actor: actorSpan("Plane"),
      timestamp: "3 days ago",
      customContent: <>archived the work item.</>,
    },
  },
});

export const Restored = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "1 day ago",
      icon: <RotateCcw className="size-3.5" />,
      customContent: <>restored the work item.</>,
    },
  },
});

// --- External source ---

export const WorkItemCreatedViaForms = meta.story({
  args: {
    data: {
      actor: actorSpan("Plane"),
      timestamp: "5 days ago",
      icon: <WorkItemsIcon className="size-3.5" />,
      customContent: (
        <span>
          created the work item via <span className="font-medium text-primary">Forms</span>.
        </span>
      ),
    },
  },
});

// --- Highlighted ---

export const WithHighlight = meta.story({
  args: {
    data: {
      actor: actorLink("Amanda"),
      timestamp: "just now",
      icon: <StatePropertyIcon className="size-3.5" />,
      customContent: (
        <>
          set the state to <span className="font-medium text-primary">Done</span>.
        </>
      ),
    },
    highlighted: true,
  },
});

// --- Multiple items with connectors ---

export const WithConnectors = meta.story({
  render: () => (
    <div className="flex flex-col">
      <ActivityListItem
        data={{
          actor: actorLink("Amanda"),
          timestamp: "1 day ago",
          icon: <WorkItemsIcon className="size-3.5" />,
          customContent: <>created the work item.</>,
        }}
        ends="top"
      />
      <ActivityListItem
        data={{
          actor: actorLink("Ethan Parker"),
          timestamp: "1 day ago",
          icon: <StatePropertyIcon className="size-3.5" />,
          customContent: (
            <>
              set the state to <span className="font-medium text-primary">In Progress</span>.
            </>
          ),
        }}
      />
      <ActivityListItem
        data={{
          actor: actorLink("Amanda"),
          timestamp: "12 hours ago",
          icon: <PriorityPropertyIcon className="size-3.5" />,
          customContent: (
            <>
              set the priority to <span className="font-medium text-primary">High</span>.
            </>
          ),
        }}
      />
      <ActivityListItem
        data={{
          actor: actorLink("Amanda"),
          timestamp: "12 hours ago",
          icon: <CalendarDays className="size-3.5" />,
          customContent: (
            <>
              set the due date to <span className="font-medium text-primary">24 Nov, 2025</span>.
            </>
          ),
        }}
      />
      <ActivityListItem
        data={{
          actor: actorLink("Ethan Parker"),
          timestamp: "6 hours ago",
          icon: <MembersPropertyIcon className="size-3.5" />,
          customContent: (
            <>
              added <span className="font-medium text-primary">John Miller</span> as an assignee.
            </>
          ),
        }}
        ends="bottom"
      />
    </div>
  ),
});
