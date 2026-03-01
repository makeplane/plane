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
  args: {
    name: "John Doe",
    src: "https://i.pravatar.cc/150?img=1",
  },
});

export const Default = meta.story({});

export const WithName = meta.story({
  args: {
    name: "Jane Smith",
    src: "https://i.pravatar.cc/150?img=5",
  },
});

export const Fallback = meta.story({
  args: {
    name: "Alice Johnson",
    src: "invalid-url",
  },
});

export const FallbackWithCustomColor = meta.story({
  args: {
    name: "Bob Wilson",
    src: "invalid-url",
    fallbackBackgroundColor: "#3b82f6",
    fallbackTextColor: "#ffffff",
  },
});

export const FallbackWithCustomText = meta.story({
  args: {
    fallbackText: "AB",
    src: "invalid-url",
    fallbackBackgroundColor: "#10b981",
    fallbackTextColor: "#ffffff",
  },
});

export const Small = meta.story({
  args: {
    name: "Small Avatar",
    src: "https://i.pravatar.cc/150?img=2",
    size: "sm",
  },
});

export const Medium = meta.story({
  args: {
    name: "Medium Avatar",
    src: "https://i.pravatar.cc/150?img=3",
    size: "md",
  },
});

export const Base = meta.story({
  args: {
    name: "Base Avatar",
    src: "https://i.pravatar.cc/150?img=4",
    size: "base",
  },
});

export const Large = meta.story({
  args: {
    name: "Large Avatar",
    src: "https://i.pravatar.cc/150?img=6",
    size: "lg",
  },
});

export const CircleShape = meta.story({
  args: {
    name: "Circle Avatar",
    src: "https://i.pravatar.cc/150?img=7",
    shape: "circle",
  },
});

export const SquareShape = meta.story({
  args: {
    name: "Square Avatar",
    src: "https://i.pravatar.cc/150?img=8",
    shape: "square",
  },
});

export const NumericSize = meta.story({
  args: {
    name: "Custom Size",
    src: "invalid-url",
    size: 48,
  },
});

export const NoNameNoFallback = meta.story({
  args: {
    src: "invalid-url",
  },
});
