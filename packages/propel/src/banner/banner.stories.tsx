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
import { Banner } from "./banner";

const meta = preview.meta({
  title: "Feedback/Banner",
  component: Banner,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "error", "warning", "info", "accent"],
      description: "Visual variant of the banner",
    },
    title: {
      control: "text",
      description: "Banner message text",
    },
    icon: {
      control: false,
      description: "Icon element to display before the title",
    },
    action: {
      control: false,
      description: "Action element(s) to display on the right side",
    },
  },
});

// Sample icons for different variants
const successIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-success-primary"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const errorIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-danger-primary"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const warningIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-yellow-600"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const infoIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-blue-600"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const closeButton = (
  <button className="rounded-sm p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Dismiss">
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-secondary"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
);

// ============================================================================
// Interactive Stories
// ============================================================================

export const Interactive = meta.story({
  args: {
    variant: "info",
    title: "This is an interactive banner. Use the controls to customize it.",
    icon: infoIcon,
    dismissible: true,
  },
});

// ============================================================================
// Main Variants
// ============================================================================

export const Success = meta.story({
  args: {
    variant: "success",
    title: "Operation completed successfully",
    icon: successIcon,
    action: closeButton,
  },
});

export const Error = meta.story({
  args: {
    variant: "error",
    title: "An error occurred while processing your request",
    icon: errorIcon,
    action: closeButton,
  },
});

export const Warning = meta.story({
  args: {
    variant: "warning",
    title: "Your session will expire in 5 minutes",
    icon: warningIcon,
    action: closeButton,
  },
});

export const Info = meta.story({
  args: {
    variant: "info",
    title: "New features are available. Check out what's new!",
    icon: infoIcon,
    action: closeButton,
  },
});

const accentIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-accent-primary"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const Accent = meta.story({
  args: {
    variant: "accent",
    title: "There is something that needs your attention",
    icon: accentIcon,
    dismissible: true,
  },
});

export const Hidden = meta.story({
  args: {
    variant: "info",
    title: "This banner is hidden",
    visible: false,
  },
});

export const NoIcon = meta.story({
  args: {
    variant: "info",
    title: "Banner without an icon",
    dismissible: true,
  },
});

export const MinimalBanner = meta.story({
  args: {
    variant: "warning",
    title: "Simple warning with no actions",
  },
});
