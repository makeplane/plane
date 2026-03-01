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
import { CustomTooltip } from "./tooltip";

const meta = preview.meta({
  component: CustomTooltip,
  parameters: {
    layout: "padded",
  },
});

export const Active = meta.story({
  args: {
    active: true,
    label: "January",
    payload: [
      { dataKey: "revenue", value: 4000, name: "Revenue", color: "#3b82f6" },
      { dataKey: "expenses", value: 2400, name: "Expenses", color: "#ef4444" },
    ],
    itemKeys: ["revenue", "expenses"],
    itemLabels: { revenue: "Revenue", expenses: "Expenses" },
    itemDotColors: { revenue: "#3b82f6", expenses: "#ef4444" },
  },
});

export const WithActiveKey = meta.story({
  args: {
    active: true,
    activeKey: "revenue",
    label: "Feb",
    payload: [
      { dataKey: "revenue", value: 3000, name: "Revenue", color: "#3b82f6" },
      { dataKey: "expenses", value: 1398, name: "Expenses", color: "#ef4444" },
    ],
    itemKeys: ["revenue", "expenses"],
    itemLabels: { revenue: "Revenue", expenses: "Expenses" },
    itemDotColors: { revenue: "#3b82f6", expenses: "#ef4444" },
  },
});

export const Inactive = meta.story({
  args: {
    active: false,
    label: "March",
    payload: [{ dataKey: "revenue", value: 5000, name: "Revenue", color: "#3b82f6" }],
    itemKeys: ["revenue"],
    itemLabels: { revenue: "Revenue" },
    itemDotColors: { revenue: "#3b82f6" },
  },
});

export const EmptyPayload = meta.story({
  args: {
    active: true,
    label: "April",
    payload: [],
    itemKeys: ["revenue"],
    itemLabels: { revenue: "Revenue" },
    itemDotColors: { revenue: "#3b82f6" },
  },
});

export const NoDotColor = meta.story({
  args: {
    active: true,
    label: "May",
    payload: [{ dataKey: "revenue", value: 1890, name: "Revenue", color: "#3b82f6" }],
    itemKeys: ["revenue"],
    itemLabels: { revenue: "Revenue" },
    itemDotColors: {},
  },
});
