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
import { expect, fn, screen } from "storybook/test";
import { Popover } from "./root";

const meta = preview.meta({
  component: Popover,
  subcomponents: {
    PopoverTrigger: Popover.Trigger,
    PopoverContent: Popover.Content,
  },
  parameters: {
    layout: "centered",
  },
  args: {
    children: null,
    onOpenChange: fn(),
  },
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Open Popover
        </Popover.Trigger>
        <Popover.Content className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">Popover Title</h3>
          <p className="mt-2 text-13 text-gray-600">This is the popover content. You can put any content here.</p>
        </Popover.Content>
      </Popover>
    );
  },
});

export const Default = meta.story({
  async play({ canvas, userEvent }) {
    const trigger = canvas.getByRole("button", { name: "Open Popover" });
    await expect(trigger).toBeVisible();
    await userEvent.click(trigger);
    const title = await screen.findByText("Popover Title");
    await expect(title).toBeVisible();
  },
});

export const SideTop = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Open Above
        </Popover.Trigger>
        <Popover.Content side="top" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">Top Positioned</h3>
          <p className="mt-2 text-13 text-gray-600">This popover appears above the button.</p>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Open Above" }));
    await expect(await screen.findByText("Top Positioned")).toBeVisible();
  },
});

export const SideBottom = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Open Below
        </Popover.Trigger>
        <Popover.Content side="bottom" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">Bottom Positioned</h3>
          <p className="mt-2 text-13 text-gray-600">This popover appears below the button.</p>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Open Below" }));
    await expect(await screen.findByText("Bottom Positioned")).toBeVisible();
  },
});

export const SideLeft = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Open Left
        </Popover.Trigger>
        <Popover.Content side="left" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">Left Positioned</h3>
          <p className="mt-2 text-13 text-gray-600">This popover appears to the left of the button.</p>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Open Left" }));
    await expect(await screen.findByText("Left Positioned")).toBeVisible();
  },
});

export const SideRight = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Open Right
        </Popover.Trigger>
        <Popover.Content side="right" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">Right Positioned</h3>
          <p className="mt-2 text-13 text-gray-600">This popover appears to the right of the button.</p>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Open Right" }));
    await expect(await screen.findByText("Right Positioned")).toBeVisible();
  },
});

export const AlignStart = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Align Start
        </Popover.Trigger>
        <Popover.Content align="start" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">Start Aligned</h3>
          <p className="mt-2 text-13 text-gray-600">This popover is aligned to the start.</p>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Align Start" }));
    await expect(await screen.findByText("Start Aligned")).toBeVisible();
  },
});

export const AlignEnd = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Align End
        </Popover.Trigger>
        <Popover.Content align="end" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">End Aligned</h3>
          <p className="mt-2 text-13 text-gray-600">This popover is aligned to the end.</p>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Align End" }));
    await expect(await screen.findByText("End Aligned")).toBeVisible();
  },
});

export const CustomOffset = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Custom Offset
        </Popover.Trigger>
        <Popover.Content sideOffset={20} className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">Custom Side Offset</h3>
          <p className="mt-2 text-13 text-gray-600">This popover has a custom side offset of 20px.</p>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Custom Offset" }));
    await expect(await screen.findByText("Custom Side Offset")).toBeVisible();
  },
});

export const WithList = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Show Options
        </Popover.Trigger>
        <Popover.Content className="w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <h3 className="px-2 py-1.5 text-11 font-semibold text-gray-500">Options</h3>
            <button className="w-full rounded-sm px-2 py-1.5 text-left text-13 hover:bg-gray-100">Option 1</button>
            <button className="w-full rounded-sm px-2 py-1.5 text-left text-13 hover:bg-gray-100">Option 2</button>
            <button className="w-full rounded-sm px-2 py-1.5 text-left text-13 hover:bg-gray-100">Option 3</button>
          </div>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Options" }));
    await expect(await screen.findByText("Option 1")).toBeVisible();
  },
});

export const WithPlacement = meta.story({
  render(args) {
    return (
      <Popover {...args}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Open With Placement
        </Popover.Trigger>
        <Popover.Content
          placement="top-start"
          className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
        >
          <h3 className="text-13 font-semibold">Placement Prop</h3>
          <p className="mt-2 text-13 text-gray-600">This popover uses the placement prop instead of side/align.</p>
        </Popover.Content>
      </Popover>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Open With Placement" }));
    await expect(await screen.findByText("Placement Prop")).toBeVisible();
  },
});
