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
import { AvatarGroup } from "./avatar-group";

const meta = preview.meta({
  component: AvatarGroup,
  subcomponents: { Avatar },
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "base", "lg"],
    },
    max: {
      control: "number",
    },
    showTooltip: {
      control: "boolean",
    },
  },
  args: {
    max: 2,
    size: "md",
    showTooltip: true,
  },
});

const fiveAvatars = [
  <Avatar key="1" name="Alice" src="https://i.pravatar.cc/150?img=1" />,
  <Avatar key="2" name="Bob" src="https://i.pravatar.cc/150?img=2" />,
  <Avatar key="3" name="Charlie" src="https://i.pravatar.cc/150?img=3" />,
  <Avatar key="4" name="Diana" src="https://i.pravatar.cc/150?img=4" />,
  <Avatar key="5" name="Eve" src="https://i.pravatar.cc/150?img=5" />,
];

export const Default = meta.story({
  args: {
    children: [
      <Avatar key="1" name="Alice Johnson" src="https://i.pravatar.cc/150?img=1" />,
      <Avatar key="2" name="Bob Wilson" src="https://i.pravatar.cc/150?img=2" />,
      <Avatar key="3" name="Charlie Brown" src="https://i.pravatar.cc/150?img=3" />,
    ],
  },
});

export const Small = Default.extend({ args: { size: "sm" } });

export const Medium = Default.extend({ args: { size: "md" } });

export const Base = Default.extend({ args: { size: "base" } });

export const Large = Default.extend({ args: { size: "lg" } });

export const MaxOne = Default.extend({ args: { max: 1, size: "base", children: fiveAvatars } });

export const MaxThree = Default.extend({ args: { max: 3, size: "base", children: fiveAvatars } });

export const MaxFour = Default.extend({ args: { max: 4, size: "base", children: fiveAvatars } });

export const WithFallbacks = Default.extend({
  args: {
    size: "base",
    children: [
      <Avatar key="1" name="Alice" fallbackBackgroundColor="#3b82f6" />,
      <Avatar key="2" name="Bob" fallbackBackgroundColor="#10b981" />,
      <Avatar key="3" name="Charlie" fallbackBackgroundColor="#f59e0b" />,
      <Avatar key="4" name="Diana" fallbackBackgroundColor="#ef4444" />,
    ],
  },
});

export const Mixed = Default.extend({
  args: {
    size: "base",
    children: [
      <Avatar key="1" name="Alice" src="https://i.pravatar.cc/150?img=1" />,
      <Avatar key="2" name="Bob" fallbackBackgroundColor="#6366f1" />,
      <Avatar key="3" name="Charlie" src="https://i.pravatar.cc/150?img=3" />,
      <Avatar key="4" name="Diana" fallbackBackgroundColor="#ec4899" />,
    ],
  },
});

export const Single = Default.extend({
  args: {
    size: "base",
    children: [<Avatar key="1" name="Alice" src="https://i.pravatar.cc/150?img=1" />],
  },
});
