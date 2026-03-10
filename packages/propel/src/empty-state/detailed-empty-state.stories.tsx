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
import { EmptyStateDetailed } from "./detailed-empty-state";

const meta = preview.meta({
  title: "Feedback/Detailed Empty State",
  component: EmptyStateDetailed,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A detailed empty state component with title, description, asset, and action buttons. Best used for feature-specific empty states that need more context. Supports vertical stack and illustration assets via `assetKey`.",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description: "The main title text for the empty state",
    },
    description: {
      control: "text",
      description: "Optional description text that appears below the title",
    },
    assetKey: {
      control: "select",
      options: [
        "archived-cycle",
        "archived-module",
        "archived-work-item",
        "customer",
        "cycle",
        "dashboard",
        "draft",
        "epic",
        "error-404",
        "invalid-link",
        "module",
        "no-access",
        "page",
        "project",
        "server-error",
        "teamspace",
        "view",
        "work-item",
        "inbox",
      ],
      description: "Predefined asset key (vertical-stack or illustration)",
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

// Primary story - showcases the most common usage
export const Default = meta.story({
  args: {
    assetKey: "epic",
    assetClassName: "w-40 h-45",
    title: "Create an epic and split work into smaller goals",
    description: "For larger bodies of work that span several cycles and can live across modules, create an epic.",
    actions: [
      {
        label: "Create an Epic",
        onClick: () => console.log("primary-action-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const WithSingleAction = meta.story({
  args: {
    assetKey: "project",
    assetClassName: "w-40 h-45",
    title: "No projects found",
    description: "Get started by creating your first project to organize your work.",
    actions: [
      {
        label: "Create Project",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const WithMultipleActions = meta.story({
  args: {
    assetKey: "module",
    assetClassName: "w-40 h-45",
    title: "No modules found",
    description: "Get started by creating your first module or import existing ones.",
    actions: [
      {
        label: "Create Module",
        onClick: () => console.log("create-clicked"),
        variant: "primary",
      },
      {
        label: "Import Modules",
        onClick: () => console.log("import-clicked"),
        variant: "secondary",
      },
    ],
  },
});

export const WithoutActions = meta.story({
  args: {
    assetKey: "dashboard",
    assetClassName: "w-40 h-45",
    title: "No activity yet",
    description: "Your activity feed will show up here once you start using the platform.",
  },
});

export const ErrorState = meta.story({
  args: {
    assetKey: "error-404",
    assetClassName: "w-40 h-45",
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
    actions: [
      {
        label: "Go to Home",
        onClick: () => console.log("home-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const ServerErrorState = meta.story({
  name: "Error - Server",
  args: {
    assetKey: "server-error",
    assetClassName: "w-40 h-45",
    title: "Something went wrong",
    description: "We're experiencing technical difficulties. Please try again later.",
    actions: [
      {
        label: "Retry",
        onClick: () => console.log("retry-clicked"),
        variant: "primary",
      },
      {
        label: "Contact Support",
        onClick: () => console.log("support-clicked"),
        variant: "secondary",
      },
    ],
  },
});

export const NoAccessState = meta.story({
  name: "Access Denied",
  args: {
    assetKey: "no-access",
    assetClassName: "w-40 h-45",
    title: "You don't have access",
    description: "Contact your workspace admin to request access to this resource.",
  },
});

export const ArchivedState = meta.story({
  name: "Archived Content",
  args: {
    assetKey: "archived-work-item",
    assetClassName: "w-40 h-45",
    title: "No archived items",
    description: "Archived items will appear here when you archive them.",
  },
});

export const CycleState = meta.story({
  name: "Cycles",
  args: {
    assetKey: "cycle",
    assetClassName: "w-40 h-45",
    title: "No cycles found",
    description: "Create cycles to organize your work into time-boxed iterations.",
    actions: [
      {
        label: "Create Cycle",
        onClick: () => console.log("create-cycle-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const ModuleState = meta.story({
  name: "Modules",
  args: {
    assetKey: "module",
    assetClassName: "w-40 h-45",
    title: "No modules found",
    description: "Modules help you organize related work items into logical groups.",
    actions: [
      {
        label: "Create Module",
        onClick: () => console.log("create-module-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const ViewState = meta.story({
  name: "Views",
  args: {
    assetKey: "view",
    assetClassName: "w-40 h-45",
    title: "No saved views",
    description: "Create custom views to filter and organize your work items.",
    actions: [
      {
        label: "Create View",
        onClick: () => console.log("create-view-clicked"),
        variant: "primary",
      },
    ],
  },
});

export const PageState = meta.story({
  name: "Pages",
  args: {
    assetKey: "page",
    assetClassName: "w-40 h-45",
    title: "No pages found",
    description: "Create pages to document your project, share knowledge, and collaborate.",
    actions: [
      {
        label: "Create Page",
        onClick: () => console.log("create-page-clicked"),
        variant: "primary",
      },
    ],
  },
});

// Using custom asset (for special cases)
export const WithCustomAsset = meta.story({
  name: "Custom Asset",
  args: {
    asset: (
      <svg className="h-45 w-40" viewBox="0 0 160 180" fill="none">
        <rect width="160" height="180" fill="#F3F4F6" rx="8" />
        <circle cx="80" cy="90" r="30" fill="#E5E7EB" />
      </svg>
    ),
    title: "Custom asset example",
    description: "This example uses a custom SVG asset instead of predefined assetKey.",
    actions: [
      {
        label: "Get Started",
        onClick: () => console.log("action-clicked"),
        variant: "primary",
      },
    ],
  },
});

// Minimal example
export const Minimal = meta.story({
  name: "Minimal - Text Only",
  args: {
    title: "No data available",
    description: "Data will appear here once available.",
  },
});
