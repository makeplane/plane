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
import { expect } from "storybook/test";
import { Calendar } from "./root";

const meta = preview.meta({
  title: "Data Display/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  args: {
    showOutsideDays: true,
    className: "rounded-md border",
  },
});

export const SingleDate = meta.story({
  args: {
    mode: "single",
    selected: new Date(2024, 5, 15),
    defaultMonth: new Date(2024, 5),
  },
});

export const SingleDateTest = SingleDate.extend({
  async play({ canvas, userEvent }) {
    const table = canvas.getByRole("grid");
    await expect(table).toBeVisible();
    const title = canvas.getByRole("button", { name: "Jun 2024" });
    await userEvent.click(title);
    await expect(canvas.getByText("Jan")).toBeVisible();
    await expect(canvas.getByText("Dec")).toBeVisible();
    await userEvent.click(canvas.getByText("Mar"));
    await expect(canvas.getByRole("grid")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Mar 2024" })).toBeVisible();
  },
});

export const MonthViewNavigation = SingleDate.extend({
  args: {
    selected: new Date(2024, 0, 15),
    defaultMonth: new Date(2024, 0),
  },
});

export const MonthViewNavigationTest = MonthViewNavigation.extend({
  async play({ canvas, userEvent }) {
    const title = canvas.getByRole("button", { name: "Jan 2024" });
    await userEvent.click(title);
    await expect(canvas.getByRole("button", { name: "2024" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "2024" }));
    await expect(canvas.getByText("2020-2029")).toBeVisible();
    await expect(canvas.getByText("2024")).toBeVisible();
    await userEvent.click(canvas.getByText("2025"));
    await expect(canvas.getByRole("button", { name: "2025" })).toBeVisible();
    await expect(canvas.getByText("Jan")).toBeVisible();
    await userEvent.click(canvas.getByText("Jul"));
    await expect(canvas.getByRole("button", { name: "Jul 2025" })).toBeVisible();
  },
});

export const DayViewNavigation = SingleDate.extend({
  async play({ canvas, userEvent }) {
    await expect(canvas.getByRole("button", { name: "Jun 2024" })).toBeVisible();
    const buttons = canvas.getAllByRole("button");
    const singleRightBtn = buttons[3];
    await userEvent.click(singleRightBtn);
    await expect(canvas.getByRole("button", { name: "Jul 2024" })).toBeVisible();
    const refreshedButtons = canvas.getAllByRole("button");
    const singleLeftBtn = refreshedButtons[1];
    await userEvent.click(singleLeftBtn);
    await expect(canvas.getByRole("button", { name: "Jun 2024" })).toBeVisible();
    const btns2 = canvas.getAllByRole("button");
    const doubleRightBtn = btns2[4];
    await userEvent.click(doubleRightBtn);
    await expect(canvas.getByRole("button", { name: "Jun 2025" })).toBeVisible();
    const btns3 = canvas.getAllByRole("button");
    const doubleLeftBtn = btns3[0];
    await userEvent.click(doubleLeftBtn);
    await expect(canvas.getByRole("button", { name: "Jun 2024" })).toBeVisible();
  },
});

export const WithTodayButton = SingleDate.extend({
  args: {
    selected: new Date(2020, 0, 15),
    defaultMonth: new Date(2020, 0),
    showTodayButton: true,
  },
  async play({ canvas, userEvent }) {
    const todayBtn = canvas.getByRole("button", { name: "Today" });
    await expect(todayBtn).toBeVisible();
    await userEvent.click(todayBtn);
    await expect(canvas.getByRole("grid")).toBeVisible();
  },
});

export const MultipleDates = meta.story({
  args: {
    mode: "multiple",
    selected: [new Date(2024, 0, 15), new Date(2024, 0, 20), new Date(2024, 0, 25)],
    defaultMonth: new Date(2024, 0),
  },
});

export const RangeSelection = meta.story({
  args: {
    mode: "range",
    selected: { from: new Date(2024, 0, 10), to: new Date(2024, 0, 20) },
    defaultMonth: new Date(2024, 0),
  },
});

export const YearViewNavigation = MonthViewNavigation.extend({
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Jan 2024" }));
    await userEvent.click(canvas.getByRole("button", { name: "2024" }));
    await expect(canvas.getByText("2020-2029")).toBeVisible();
    const buttons = canvas.getAllByRole("button");
    await userEvent.click(buttons[0]);
    await expect(canvas.getByText("2010-2019")).toBeVisible();
    const btns2 = canvas.getAllByRole("button");
    await userEvent.click(btns2[1]);
    await expect(canvas.getByText("2020-2029")).toBeVisible();
  },
});

export const MonthViewYearNavigation = SingleDate.extend({
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Jun 2024" }));
    await expect(canvas.getByRole("button", { name: "2024" })).toBeVisible();
    const buttons = canvas.getAllByRole("button");
    await userEvent.click(buttons[0]);
    await expect(canvas.getByRole("button", { name: "2023" })).toBeVisible();
    const btns2 = canvas.getAllByRole("button");
    await userEvent.click(btns2[2]);
    await expect(canvas.getByRole("button", { name: "2024" })).toBeVisible();
  },
});

export const Uncontrolled = meta.story({
  args: {
    mode: "single",
    defaultMonth: new Date(2024, 0),
  },
});
