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

import { CustomActiveShape } from "./active-shape";

const meta = preview.meta({
  component: CustomActiveShape,
  parameters: {
    layout: "padded",
  },
  args: {
    cx: 150,
    cy: 150,
    outerRadius: 100,
    startAngle: 0,
    endAngle: 90,
    fill: "#3b82f6",
  },
  decorators: [
    (Story) => (
      <svg width={300} height={300}>
        <Story />
      </svg>
    ),
  ],
});

export const Default = meta.story({
  args: {
    innerRadius: 60,
    cornerRadius: 4,
  },
});

export const FullCircle = meta.story({
  args: {
    innerRadius: 0,
    outerRadius: 120,
    endAngle: 360,
    fill: "#22c55e",
  },
});

export const NoInnerRadius = meta.story({
  args: {
    startAngle: 45,
    endAngle: 135,
    fill: "#ef4444",
  },
});
