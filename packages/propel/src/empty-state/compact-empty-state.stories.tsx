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
import { EmptyStateCompact } from "./compact-empty-state";

const meta = preview.meta({
  title: "Feedback/Compact Empty State",
  component: EmptyStateCompact,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A compact empty state component with centered title, asset, and action buttons. Best used for simple, space-constrained empty states. Supports horizontal stack and illustration assets via `assetKey`.",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description: "The main title text for the empty state",
    },
    assetKey: {
      control: "select",
      options: [
        "customer",
        "epic",
        "estimate",
        "export",
        "intake",
        "label",
        "link",
        "members",
        "note",
        "priority",
        "project",
        "settings",
        "state",
        "template",
        "token",
        "unknown",
        "update",
        "webhook",
        "work-item",
        "worklog",
        "inbox",
      ],
      description: "Predefined asset key (horizontal-stack or illustration)",
    },
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the content wrapper",
    },
    rootClassName: {
      control: "text",
      description: "Additional CSS classes to apply to the root container",
    },
    assetClassName: {
      control: "text",
      description: "Additional CSS classes to apply to the asset",
    },
    asset: {
      control: false,
      description: "Custom React node to display as the visual asset (use this for full control instead of assetKey)",
    },
    actions: {
      control: false,
      description: "Array of action buttons to display",
    },
  },
});

// Using assetKey (recommended approach)
export const WithAssetKey = meta.story({
  args: {
    assetKey: "work-item",
    assetClassName: "size-20",
    title: "There're no progress metrics to show yet.",
  },
});

export const WithAssetKeyAndAction = meta.story({
  args: {
    assetKey: "project",
    assetClassName: "size-20",
    title: "No projects found",
    actions: [
      {
        label: "Create Project",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const WithAssetKeyAndMultipleActions = meta.story({
  args: {
    assetKey: "members",
    assetClassName: "size-20",
    title: "Get started with your workspace",
    actions: [
      {
        label: "Create Project",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
      {
        label: "Import",
        onClick: () => console.log("import-clicked"),
        variant: "secondary",
      },
    ],
  },
});

// Using custom asset (legacy approach)
export const WithCustomAsset = meta.story({
  args: {
    asset: (
      <svg className="h-40 w-40" viewBox="0 0 160 180" fill="none">
        <rect width="160" height="180" fill="#F3F4F6" rx="8" />
      </svg>
    ),
    title: "No items found",
    actions: [
      {
        label: "Create Item",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const TitleOnly = meta.story({
  args: {
    title: "No results found",
  },
});

export const WithDescription = meta.story({
  args: {
    assetKey: "label",
    assetClassName: "size-20",
    title: "No labels found",
    description: "Create labels to categorize and organize your work items.",
    actions: [
      {
        label: "Create Label",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const WithCustomButton = meta.story({
  args: {
    assetKey: "settings",
    assetClassName: "size-20",
    title: "Configure your settings",
    customButton: <button className="px-4 py-2 bg-blue-500 text-white rounded-md text-13">Custom Button</button>,
  },
});

export const LeftAligned = meta.story({
  args: {
    assetKey: "note",
    assetClassName: "size-20",
    title: "No notes yet",
    description: "Start writing notes to keep track of ideas.",
    align: "start",
  },
});
