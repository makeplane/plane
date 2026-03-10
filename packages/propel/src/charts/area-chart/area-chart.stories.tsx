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
import { AreaChart } from "./root";

const sampleData = [
  { month: "Jan", revenue: 4000, expenses: 2400 },
  { month: "Feb", revenue: 3000, expenses: 1398 },
  { month: "Mar", revenue: 2000, expenses: 9800 },
  { month: "Apr", revenue: 2780, expenses: 3908 },
  { month: "May", revenue: 1890, expenses: 4800 },
  { month: "Jun", revenue: 2390, expenses: 3800 },
];

const revenueArea = {
  key: "revenue",
  label: "Revenue",
  stackId: "1",
  fill: "#3b82f6",
  fillOpacity: 0.3,
  showDot: false,
  smoothCurves: true,
  strokeColor: "#3b82f6",
  strokeOpacity: 1,
} as const;

const expensesArea = {
  key: "expenses",
  label: "Expenses",
  stackId: "1",
  fill: "#ef4444",
  fillOpacity: 0.3,
  showDot: false,
  smoothCurves: true,
  strokeColor: "#ef4444",
  strokeOpacity: 1,
} as const;

const meta = preview.meta({
  title: "Charts/Area Chart",
  component: AreaChart,
  parameters: {
    layout: "padded",
  },
  args: {
    className: "w-full h-[300px]",
    data: sampleData,
    areas: [revenueArea],
    xAxis: { key: "month" },
    yAxis: { key: "revenue" },
  },
});

export const Default = meta.story({});

export const Stacked = meta.story({
  args: {
    areas: [revenueArea, expensesArea],
  },
});

export const WithComparisonLine = meta.story({
  args: {
    areas: [{ ...revenueArea, showDot: true, smoothCurves: false }],
    comparisonLine: {
      dashedLine: true,
      strokeColor: "#f59e0b",
    },
  },
});

export const WithLegend = meta.story({
  args: {
    areas: [revenueArea, expensesArea],
    xAxis: { key: "month", label: "Month" },
    yAxis: { key: "revenue", label: "Amount" },
    legend: { layout: "horizontal", align: "center", verticalAlign: "bottom" },
  },
});

export const NoTooltip = meta.story({
  args: {
    showTooltip: false,
  },
});

export const WithSolidComparisonLine = meta.story({
  args: {
    comparisonLine: {
      dashedLine: false,
      strokeColor: "#22c55e",
    },
  },
});

export const LinearWithDots = meta.story({
  args: {
    areas: [{ ...revenueArea, showDot: true, smoothCurves: false }],
  },
});
