import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { X } from "lucide-react";
import { useArgs } from "storybook/preview-api";
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Open Popover
        </Popover.Button>
        <Popover.Panel className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">Popover Title</h3>
          <p className="mt-2 text-sm text-gray-600">This is the popover content. You can put any content here.</p>
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
          <button onClick={() => setOpen(true)} className="rounded bg-blue-500 px-3 py-1.5 text-sm text-white">
            Open
          </button>
          <button onClick={() => setOpen(false)} className="rounded bg-gray-500 px-3 py-1.5 text-sm text-white">
            Close
          </button>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Controlled Popover
          </Popover.Button>
          <Popover.Panel className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold">Controlled State</h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">Current state: {open ? "Open" : "Closed"}</p>
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Open Above
        </Popover.Button>
        <Popover.Panel side="top" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">Top Positioned</h3>
          <p className="mt-2 text-sm text-gray-600">This popover appears above the button.</p>
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Open Below
        </Popover.Button>
        <Popover.Panel side="bottom" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">Bottom Positioned</h3>
          <p className="mt-2 text-sm text-gray-600">This popover appears below the button.</p>
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Open Left
        </Popover.Button>
        <Popover.Panel side="left" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">Left Positioned</h3>
          <p className="mt-2 text-sm text-gray-600">This popover appears to the left of the button.</p>
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Open Right
        </Popover.Button>
        <Popover.Panel side="right" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">Right Positioned</h3>
          <p className="mt-2 text-sm text-gray-600">This popover appears to the right of the button.</p>
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Align Start
        </Popover.Button>
        <Popover.Panel align="start" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">Start Aligned</h3>
          <p className="mt-2 text-sm text-gray-600">This popover is aligned to the start.</p>
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Align End
        </Popover.Button>
        <Popover.Panel align="end" className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">End Aligned</h3>
          <p className="mt-2 text-sm text-gray-600">This popover is aligned to the end.</p>
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Custom Offset
        </Popover.Button>
        <Popover.Panel sideOffset={20} className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">Custom Side Offset</h3>
          <p className="mt-2 text-sm text-gray-600">This popover has a custom side offset of 20px.</p>
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Open Form
        </Popover.Button>
        <Popover.Panel className="w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="text-sm font-semibold">Quick Form</h3>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                placeholder="Enter email"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded bg-gray-200 px-3 py-1.5 text-xs hover:bg-gray-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600">
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
        <Popover.Button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Show Options
        </Popover.Button>
        <Popover.Panel className="w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <h3 className="px-2 py-1.5 text-xs font-semibold text-gray-500">Options</h3>
            <button className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100">Option 1</button>
            <button className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100">Option 2</button>
            <button className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100">Option 3</button>
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
        <Popover.Button className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <div className="h-4 w-4 rounded" style={{ backgroundColor: selectedColor }} />
          <span className="text-sm">Pick Color</span>
        </Popover.Button>
        <Popover.Panel className="w-48 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <h3 className="mb-2 text-xs font-semibold">Select Color</h3>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="h-8 w-8 rounded border-2 transition-transform hover:scale-110"
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
