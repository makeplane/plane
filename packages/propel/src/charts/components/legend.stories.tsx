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

import React from "react";
import preview from "#.storybook/preview";
import { expect, fn } from "storybook/test";
import { getLegendProps } from "./legend";

const legendPayload = [
  { value: "Revenue", color: "#3b82f6", payload: { name: "Revenue" } },
  { value: "Expenses", color: "#ef4444", payload: { name: "Expenses" } },
  { value: "Profit", color: "#22c55e", payload: { name: "Profit" } },
];

const meta = preview.meta({
  title: "Charts/Components/Legend",
  parameters: {
    layout: "padded",
  },
});

export const Horizontal = meta.story({
  render() {
    const props = getLegendProps({ layout: "horizontal", align: "center", verticalAlign: "bottom" });
    return React.cloneElement(props.content as React.ReactElement, { payload: legendPayload });
  },
});

export const Vertical = meta.story({
  render() {
    const props = getLegendProps({ layout: "vertical", align: "right", verticalAlign: "middle" });
    return React.cloneElement(props.content as React.ReactElement, { payload: legendPayload });
  },
});

export const EmptyPayload = meta.story({
  render() {
    const props = getLegendProps({ layout: "horizontal", align: "center", verticalAlign: "bottom" });
    return (
      <div data-testid="empty-legend">{React.cloneElement(props.content as React.ReactElement, { payload: [] })}</div>
    );
  },
});

export const WithFormatter = meta.story({
  render() {
    const props = getLegendProps({ layout: "horizontal", align: "center", verticalAlign: "bottom" });
    return React.cloneElement(props.content as React.ReactElement, {
      payload: legendPayload,
      formatter: (value: string) => value.toUpperCase(),
    });
  },
});

export const WithClickHandler = meta.story({
  render() {
    const handleClick = fn();
    const handleMouseEnter = fn();
    const handleMouseLeave = fn();
    const props = getLegendProps({ layout: "horizontal", align: "center", verticalAlign: "bottom" });
    return React.cloneElement(props.content as React.ReactElement, {
      payload: legendPayload,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    });
  },
  async play({ canvasElement, userEvent }) {
    const items = canvasElement.querySelectorAll("[class*='cursor-pointer']");
    await expect(items.length).toBeGreaterThan(0);
    // Click, hover, and unhover the first legend item
    await userEvent.click(items[0]);
    await userEvent.hover(items[0]);
    await userEvent.unhover(items[0]);
  },
});

export const VerticalWithWrapperStyles = meta.story({
  render() {
    const props = getLegendProps({
      layout: "vertical",
      align: "right",
      verticalAlign: "middle",
      wrapperStyles: { padding: "8px" },
    });
    return React.cloneElement(props.content as React.ReactElement, { payload: legendPayload });
  },
});
