/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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
    PopoverButton: Popover.Button,
    PopoverPanel: Popover.Panel,
  },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
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
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Open Popover
        </Popover.Button>
        <Popover.Panel className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">Popover Title</h3>
          <p className="text-gray-600 mt-2 text-13">This is the popover content. You can put any content here.</p>
        </Popover.Panel>
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
          <button onClick={() => setOpen(true)} className="bg-blue-500 rounded-sm px-3 py-1.5 text-13 text-on-color">
            Open
          </button>
          <button onClick={() => setOpen(false)} className="bg-gray-500 rounded-sm px-3 py-1.5 text-13 text-on-color">
            Close
          </button>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
            Controlled Popover
          </Popover.Button>
          <Popover.Panel className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between">
              <h3 className="text-13 font-semibold">Controlled State</h3>
              <button onClick={() => setOpen(false)} className="hover:bg-gray-100 rounded-full p-1">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-gray-600 mt-2 text-13">Current state: {open ? "Open" : "Closed"}</p>
          </Popover.Panel>
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
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Open Above
        </Popover.Button>
        <Popover.Panel side="top" className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">Top Positioned</h3>
          <p className="text-gray-600 mt-2 text-13">This popover appears above the button.</p>
        </Popover.Panel>
      </Popover>
    );
  },
};

export const SideBottom: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Open Below
        </Popover.Button>
        <Popover.Panel side="bottom" className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">Bottom Positioned</h3>
          <p className="text-gray-600 mt-2 text-13">This popover appears below the button.</p>
        </Popover.Panel>
      </Popover>
    );
  },
};

export const SideLeft: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Open Left
        </Popover.Button>
        <Popover.Panel side="left" className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">Left Positioned</h3>
          <p className="text-gray-600 mt-2 text-13">This popover appears to the left of the button.</p>
        </Popover.Panel>
      </Popover>
    );
  },
};

export const SideRight: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Open Right
        </Popover.Button>
        <Popover.Panel side="right" className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">Right Positioned</h3>
          <p className="text-gray-600 mt-2 text-13">This popover appears to the right of the button.</p>
        </Popover.Panel>
      </Popover>
    );
  },
};

export const AlignStart: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Align Start
        </Popover.Button>
        <Popover.Panel align="start" className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">Start Aligned</h3>
          <p className="text-gray-600 mt-2 text-13">This popover is aligned to the start.</p>
        </Popover.Panel>
      </Popover>
    );
  },
};

export const AlignEnd: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Align End
        </Popover.Button>
        <Popover.Panel align="end" className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">End Aligned</h3>
          <p className="text-gray-600 mt-2 text-13">This popover is aligned to the end.</p>
        </Popover.Panel>
      </Popover>
    );
  },
};

export const CustomOffset: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Custom Offset
        </Popover.Button>
        <Popover.Panel sideOffset={20} className="border-gray-200 shadow-lg w-64 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">Custom Side Offset</h3>
          <p className="text-gray-600 mt-2 text-13">This popover has a custom side offset of 20px.</p>
        </Popover.Panel>
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
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Open Form
        </Popover.Button>
        <Popover.Panel className="border-gray-200 shadow-lg w-72 rounded-lg border bg-white p-4">
          <h3 className="text-13 font-semibold">Quick Form</h3>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label htmlFor="name" className="text-gray-700 block text-11 font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="border-gray-300 mt-1 w-full rounded-sm border px-2 py-1.5 text-13"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-gray-700 block text-11 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="border-gray-300 mt-1 w-full rounded-sm border px-2 py-1.5 text-13"
                placeholder="Enter email"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 rounded-sm px-3 py-1.5 text-11"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 rounded-sm px-3 py-1.5 text-11 text-on-color"
              >
                Submit
              </button>
            </div>
          </form>
        </Popover.Panel>
      </Popover>
    );
  },
};

export const WithList: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <Popover {...args} open={open} onOpenChange={setOpen}>
        <Popover.Button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">
          Show Options
        </Popover.Button>
        <Popover.Panel className="border-gray-200 shadow-lg w-56 rounded-lg border bg-white">
          <div className="p-2">
            <h3 className="text-gray-500 px-2 py-1.5 text-11 font-semibold">Options</h3>
            <button className="hover:bg-gray-100 w-full rounded-sm px-2 py-1.5 text-left text-13">Option 1</button>
            <button className="hover:bg-gray-100 w-full rounded-sm px-2 py-1.5 text-left text-13">Option 2</button>
            <button className="hover:bg-gray-100 w-full rounded-sm px-2 py-1.5 text-left text-13">Option 3</button>
          </div>
        </Popover.Panel>
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
        <Popover.Button className="border-gray-300 hover:bg-gray-50 flex items-center gap-2 rounded-sm border bg-white px-4 py-2">
          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: selectedColor }} />
          <span className="text-13">Pick Color</span>
        </Popover.Button>
        <Popover.Panel className="border-gray-200 shadow-lg w-48 rounded-lg border bg-white p-3">
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
        </Popover.Panel>
      </Popover>
    );
  },
};
