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

import { Logo } from "./logo";

const meta = preview.meta({
  component: Logo,
  parameters: {
    layout: "centered",
  },
});

export const EmojiLogo = meta.story({
  args: {
    logo: {
      in_use: "emoji",
      emoji: { value: "128640" },
    },
    size: 24,
  },
});

export const MaterialIconLogo = meta.story({
  args: {
    logo: {
      in_use: "icon",
      icon: { name: "rocket_launch", color: "#3b82f6" },
    },
    size: 24,
    type: "material",
  },
});

export const LucideIconLogo = meta.story({
  args: {
    logo: {
      in_use: "icon",
      icon: { name: "Activity", color: "#ef4444" },
    },
    size: 24,
    type: "lucide",
  },
});

export const NoLogo = meta.story({
  args: {
    logo: undefined,
    size: 16,
  },
});

export const EmptyInUse = meta.story({
  args: {
    logo: { in_use: "emoji", emoji: { value: "" } },
    size: 16,
  },
});

export const LargeSize = meta.story({
  args: {
    logo: {
      in_use: "emoji",
      emoji: { value: "128640" },
    },
    size: 48,
  },
});

export const LucideIconNotFound = meta.story({
  args: {
    logo: {
      in_use: "icon",
      icon: { name: "nonexistent-icon-xyz", color: "#3b82f6" },
    },
    size: 24,
    type: "lucide",
  },
});

export const MaterialIconLargeSize = meta.story({
  args: {
    logo: {
      in_use: "icon",
      icon: { name: "rocket_launch", color: "#10b981" },
    },
    size: 48,
    type: "material",
  },
});

export const NoInUse = meta.story({
  args: {
    // @ts-expect-error testing edge case with missing in_use
    logo: { emoji: { value: "128640" } },
    size: 16,
  },
});

export const IconWithMissingValue = meta.story({
  args: {
    logo: {
      in_use: "icon",
      icon: { name: "", color: "#3b82f6" },
    },
    size: 16,
  },
});
