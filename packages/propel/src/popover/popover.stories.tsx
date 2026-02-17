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

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { CloseIcon } from "../icons/actions/close-icon";
import { Popover } from "./root";

// cannot use satifies here because base-ui does not have portable types.
const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
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
    open: undefined,
    onOpenChange: () => {},
  },
  render(args) {
    const [{ open }, updateArgs] = useArgs();
    const setOpen = (value: boolean | undefined) => updateArgs({ open: value });

    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
  },
};

export const Controlled: Story = {
  render() {
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setOpen(true)} className="rounded-sm bg-blue-500 px-3 py-1.5 text-13 text-on-color">
            Open
          </button>
          <button onClick={() => setOpen(false)} className="rounded-sm bg-gray-500 px-3 py-1.5 text-13 text-on-color">
            Close
          </button>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
            Controlled Popover
          </Popover.Trigger>
          <Popover.Content className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-13 font-semibold">Controlled State</h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-gray-100">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-13 text-gray-600">Current state: {open ? "Open" : "Closed"}</p>
          </Popover.Content>
        </Popover>
      </div>
    );
  },
};

export const SideTop: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export const SideBottom: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export const SideLeft: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export const SideRight: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export const AlignStart: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export const AlignEnd: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export const CustomOffset: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export const WithForm: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open ?? false);
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Form submitted!");
      setOpen(false);
    };
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
        <Popover.Trigger className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">
          Open Form
        </Popover.Trigger>
        <Popover.Content className="w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-13 font-semibold">Quick Form</h3>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label htmlFor="name" className="block text-11 font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 w-full rounded-sm border border-gray-300 px-2 py-1.5 text-13"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-11 font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 w-full rounded-sm border border-gray-300 px-2 py-1.5 text-13"
                placeholder="Enter email"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm bg-gray-200 px-3 py-1.5 text-11 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-sm bg-blue-500 px-3 py-1.5 text-11 text-on-color hover:bg-blue-600"
              >
                Submit
              </button>
            </div>
          </form>
        </Popover.Content>
      </Popover>
    );
  },
};

export const WithList: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
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
};

export const ColorPicker: Story = {
  render() {
    const [selectedColor, setSelectedColor] = useState("#3b82f6");
    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#000000", "#ffffff"];

    return (
      <Popover>
        <Popover.Trigger className="flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: selectedColor }} />
          <span className="text-13">Pick Color</span>
        </Popover.Trigger>
        <Popover.Content className="w-48 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <h3 className="mb-2 text-11 font-semibold">Select Color</h3>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="h-8 w-8 rounded-sm border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  borderColor: selectedColor === color ? "#000" : "transparent",
                }}
              />
            ))}
          </div>
        </Popover.Content>
      </Popover>
    );
  },
};
