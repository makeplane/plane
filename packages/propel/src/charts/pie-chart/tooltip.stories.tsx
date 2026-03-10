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

import { CustomPieChartTooltip } from "./tooltip";

const meta = preview.meta({
  title: "Charts/Pie Chart Tooltip",
  component: CustomPieChartTooltip,
  parameters: {
    layout: "padded",
  },
});

export const WithPayload = meta.story({
  args: {
    dotColor: "#22c55e",
    label: "Work Items",
    payload: [
      { dataKey: "completed", value: 42, name: "Completed", color: "#22c55e" },
      { dataKey: "inProgress", value: 18, name: "In Progress", color: "#f59e0b" },
    ],
  },
});

export const SingleItem = meta.story({
  args: {
    dotColor: "#3b82f6",
    label: "Revenue",
    payload: [{ dataKey: "revenue", value: 1000, name: "Q1 Revenue", color: "#3b82f6" }],
  },
});

export const EmptyPayload = meta.story({
  args: {
    dotColor: "#ef4444",
    label: "Empty",
    payload: [],
  },
});
