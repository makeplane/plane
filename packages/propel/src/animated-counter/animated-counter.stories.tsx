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
import { AnimatedCounter } from "./animated-counter";

const meta = preview.meta({
  component: AnimatedCounter,
  parameters: {
    layout: "centered",
  },
  args: {
    count: 0,
    size: "md",
  },
});

export const Default = meta.story({
  args: { count: 0 },
});

export const SmallSize = meta.story({
  args: { count: 42, size: "sm" },
});

export const LargeSize = meta.story({
  args: { count: 1234567, size: "lg" },
});

export const WithCount = meta.story({
  args: { count: 42 },
});

export const LargeNumber = meta.story({
  args: { count: 1234567, size: "lg" },
});

export const CustomClassName = meta.story({
  args: { count: 10, size: "lg", className: "text-20" },
});
