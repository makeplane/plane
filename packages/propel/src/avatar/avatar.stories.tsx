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

import { Avatar } from "./avatar";

const meta = preview.meta({
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "base", "lg"],
    },
    shape: {
      control: "select",
      options: ["circle", "square"],
    },
  },
  args: {
    name: "John Doe",
    src: "https://i.pravatar.cc/150?img=1",
  },
});

export const Default = meta.story({});

export const Circle = Default.extend({ args: { shape: "circle", size: "lg" } });

export const Square = Default.extend({ args: { shape: "square", size: "lg" } });

export const Small = Default.extend({ args: { size: "sm" } });

export const Medium = Default.extend({ args: { size: "md" } });

export const Base = Default.extend({ args: { size: "base" } });

export const Large = Default.extend({ args: { size: "lg" } });

export const CustomSize = Default.extend({ args: { size: 48 } });

export const FallbackInitials = Default.extend({ args: { name: "Alice Johnson", src: undefined } });

export const FallbackCustomColor = Default.extend({
  args: { name: "Bob Wilson", src: undefined, fallbackBackgroundColor: "#3b82f6" },
});

export const FallbackCustomText = Default.extend({
  args: { fallbackText: "AB", name: undefined, src: undefined, fallbackBackgroundColor: "#10b981" },
});

export const FallbackNoName = Default.extend({
  args: { name: undefined, src: undefined, fallbackBackgroundColor: "#f59e0b" },
});

export const InvalidUrl = Default.extend({
  args: { name: "John Doe", src: "https://invalid-url-example.com/404.png" },
});

export const Workspace = Default.extend({
  args: { name: "Plane", shape: "square", size: "lg", src: undefined, fallbackBackgroundColor: "#3b82f6" },
});
