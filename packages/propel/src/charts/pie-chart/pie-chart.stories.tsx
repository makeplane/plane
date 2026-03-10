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
import { PieChart } from "./root";

const sampleData = [
  { name: "Completed", value: 400 },
  { name: "In Progress", value: 300 },
  { name: "Backlog", value: 200 },
  { name: "Cancelled", value: 100 },
];

const cells = [
  { key: "Completed", fill: "#22c55e" },
  { key: "In Progress", fill: "#f59e0b" },
  { key: "Backlog", fill: "#6b7280" },
  { key: "Cancelled", fill: "#ef4444" },
];

const meta = preview.meta({
  title: "Charts/Pie Chart",
  component: PieChart,
  parameters: {
    layout: "padded",
  },
  args: {
    className: "w-[400px] h-[300px]",
    data: sampleData,
    dataKey: "value",
    cells,
    showLabel: false,
  },
});

export const Default = meta.story({
  args: {
    showLabel: true,
  },
});

export const Donut = meta.story({
  args: {
    innerRadius: "60%",
    outerRadius: "80%",
    centerLabel: {
      fill: "#333",
      text: "1000",
    },
    paddingAngle: 2,
  },
});

export const WithLegend = meta.story({
  args: {
    legend: { layout: "horizontal", align: "center", verticalAlign: "bottom" },
  },
});

export const WithVerticalLegend = meta.story({
  args: {
    legend: { layout: "vertical", align: "right", verticalAlign: "middle" },
  },
});

export const NoTooltip = meta.story({
  args: {
    showTooltip: false,
  },
});

export const WithCustomLabel = meta.story({
  args: {
    showLabel: true,
    customLabel: (count: number) => `${count}%`,
  },
});

export const WithTooltipLabel = meta.story({
  args: {
    tooltipLabel: "Work Items",
  },
});

export const WithCornerRadius = meta.story({
  args: {
    innerRadius: "50%",
    outerRadius: "80%",
    cornerRadius: 8,
    paddingAngle: 3,
  },
});

export const WithTooltipLabelFunction = meta.story({
  args: {
    tooltipLabel: (payload: Record<string, unknown>) => `Items: ${payload?.name ?? ""}`,
  },
});

export const CenterLabelWithLabels = meta.story({
  args: {
    showLabel: true,
    innerRadius: "50%",
    outerRadius: "80%",
    centerLabel: {
      fill: "#333",
      text: "1000",
    },
  },
});
