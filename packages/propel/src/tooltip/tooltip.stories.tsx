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
import { HelpCircle } from "lucide-react";
import { expect, screen } from "storybook/test";
import { Tooltip } from "./root";

const meta = preview.meta({
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
});

export const Default = meta.story({
  args: {
    tooltipContent: "This is a tooltip",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Hover me</button>,
  },
  async play({ canvas, userEvent }) {
    const trigger = canvas.getByRole("button", { name: "Hover me" });
    await expect(trigger).toBeVisible();
    await userEvent.hover(trigger);
    const tooltip = await screen.findByText("This is a tooltip");
    await expect(tooltip).toBeVisible();
    await userEvent.unhover(trigger);
  },
});

export const WithHeading = meta.story({
  args: {
    tooltipHeading: "Tooltip Title",
    tooltipContent: "This is the tooltip content with a heading.",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Hover me</button>,
  },
  async play({ canvas, userEvent }) {
    const trigger = canvas.getByRole("button", { name: "Hover me" });
    await userEvent.hover(trigger);
    const heading = await screen.findByText("Tooltip Title");
    await expect(heading).toBeVisible();
    await userEvent.unhover(trigger);
  },
});

export const PositionTop = meta.story({
  args: {
    tooltipContent: "Tooltip on top",
    position: "top",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Top</button>,
  },
});

export const PositionBottom = meta.story({
  args: {
    tooltipContent: "Tooltip on bottom",
    position: "bottom",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Bottom</button>,
  },
});

export const PositionLeft = meta.story({
  args: {
    tooltipContent: "Tooltip on left",
    position: "left",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Left</button>,
  },
});

export const PositionRight = meta.story({
  args: {
    tooltipContent: "Tooltip on right",
    position: "right",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Right</button>,
  },
});

export const WithIcon = meta.story({
  args: {
    tooltipContent: "Click here for help",
    children: (
      <button className="rounded-full p-2 hover:bg-gray-100">
        <HelpCircle className="h-5 w-5 text-gray-600" />
      </button>
    ),
  },
});

export const Disabled = meta.story({
  args: {
    tooltipContent: "This tooltip is disabled",
    disabled: true,
    children: <button className="rounded-sm bg-gray-400 px-4 py-2 text-on-color">Hover me (disabled)</button>,
  },
});

export const LongContent = meta.story({
  args: {
    tooltipHeading: "Important Information",
    tooltipContent:
      "This is a longer tooltip with more detailed information that wraps to multiple lines. It provides comprehensive details about the element.",
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Long content</button>,
  },
});

export const CustomDelay = meta.story({
  args: {
    tooltipContent: "This tooltip has a custom delay",
    openDelay: 1000,
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Custom delay (1s)</button>,
  },
});

export const CustomOffset = meta.story({
  args: {
    tooltipContent: "Custom offset tooltip",
    sideOffset: 20,
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Custom offset</button>,
  },
});

export const OnText = meta.story({
  args: {
    tooltipContent: "Additional information about this word",
    position: "top",
    children: <span className="cursor-help border-b border-dashed border-blue-500 text-blue-500">tooltip</span>,
  },
  render(args) {
    return (
      <p className="text-13 text-gray-700">
        This is some text with a <Tooltip {...args} /> in it.
      </p>
    );
  },
});

export const OnDisabledButton = meta.story({
  args: {
    tooltipContent: "This feature is currently unavailable",
    position: "top",
    children: (
      <button className="cursor-not-allowed rounded-sm bg-gray-300 px-4 py-2 text-gray-500" disabled>
        Disabled Button
      </button>
    ),
  },
});

export const ComplexContent = meta.story({
  args: {
    tooltipHeading: "User Information",
    tooltipContent: (
      <div className="space-y-1">
        <p className="font-semibold">John Doe</p>
        <p className="text-11">john@example.com</p>
        <p className="text-11 text-gray-400">Last seen: 2 hours ago</p>
      </div>
    ),
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">View User</button>,
  },
});

export const WithCustomStyling = meta.story({
  args: {
    tooltipContent: "Custom styled tooltip",
    className: "bg-purple-500 text-on-color",
    children: <button className="rounded-sm bg-purple-500 px-4 py-2 text-on-color">Custom style</button>,
  },
});

export const Mobile = meta.story({
  args: {
    tooltipContent: "This tooltip is hidden on mobile",
    isMobile: true,
    children: <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Mobile hidden</button>,
  },
});

export const InFormField = meta.story({
  args: {
    tooltipHeading: "Email Requirements",
    tooltipContent: "Enter a valid email address that you have access to. We'll send a verification link.",
    position: "right",
    children: <HelpCircle className="h-4 w-4 cursor-help text-gray-400" />,
  },
  render(args) {
    return (
      <div className="w-80">
        <label htmlFor="email-field" className="mb-1 flex items-center gap-2 text-13 font-medium text-gray-700">
          Email Address
          <Tooltip {...args} />
        </label>
        <input
          id="email-field"
          type="email"
          className="w-full rounded-sm border border-gray-300 px-3 py-2 text-13"
          placeholder="you@example.com"
        />
      </div>
    );
  },
});
