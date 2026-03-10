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
import { TreeMapChart } from "./root";

const sampleData = [
  { name: "Frontend", value: 120, label: "120 items", fillColor: "#3b82f6" },
  { name: "Backend", value: 80, label: "80 items", fillColor: "#22c55e" },
  { name: "Mobile", value: 45, label: "45 items", fillColor: "#f59e0b" },
  { name: "DevOps", value: 30, label: "30 items", fillColor: "#ef4444" },
  { name: "Design", value: 25, label: "25 items", fillColor: "#8b5cf6" },
];

const meta = preview.meta({
  title: "Charts/Tree Map",
  component: TreeMapChart,
  parameters: {
    layout: "padded",
  },
});

export const Default = meta.story({
  args: {
    data: sampleData,
    className: "w-full h-96",
  },
});

export const WithoutTooltip = meta.story({
  args: {
    data: sampleData,
    className: "w-full h-64",
    showTooltip: false,
  },
});

export const NoLabels = meta.story({
  args: {
    data: [
      { name: "Frontend", value: 120, fillColor: "#3b82f6" },
      { name: "Backend", value: 80, fillColor: "#22c55e" },
      { name: "Mobile", value: 45, fillColor: "#f59e0b" },
    ],
    className: "w-full h-64",
  },
});

export const ManySmallItems = meta.story({
  args: {
    data: [
      { name: "A", value: 100, label: "100 items", fillColor: "#3b82f6" },
      { name: "B", value: 90, label: "90 items", fillColor: "#22c55e" },
      { name: "C", value: 80, label: "80 items", fillColor: "#f59e0b" },
      { name: "D", value: 70, label: "70 items", fillColor: "#ef4444" },
      { name: "E", value: 60, label: "60 items", fillColor: "#8b5cf6" },
      { name: "F", value: 50, label: "50 items", fillColor: "#ec4899" },
      { name: "G", value: 40, label: "40 items", fillColor: "#14b8a6" },
      { name: "H", value: 30, label: "30 items", fillColor: "#f97316" },
      { name: "I", value: 20, label: "20 items", fillColor: "#6366f1" },
      { name: "J", value: 10, label: "10 items", fillColor: "#84cc16" },
      { name: "K", value: 5, label: "5 items", fillColor: "#06b6d4" },
      { name: "L", value: 3, label: "3 items", fillColor: "#a855f7" },
    ],
    className: "w-full h-48",
  },
});
