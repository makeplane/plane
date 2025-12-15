import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { ChevronDownIcon } from "../icons/arrows/chevron-down";
import { Collapsible } from "./collapsible";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible.CollapsibleRoot,
  subcomponents: {
    CollapsibleTrigger: Collapsible.CollapsibleTrigger,
    CollapsibleContent: Collapsible.CollapsibleContent,
  },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: null,
    isOpen: false,
    onToggle: () => {},
  },
  render(args) {
    const [{ isOpen }, updateArgs] = useArgs();
    const toggleOpen = () => updateArgs({ isOpen: !isOpen });

    return (
      <Collapsible.CollapsibleRoot {...args} isOpen={isOpen} onToggle={toggleOpen} className="w-96">
        <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
          <span className="font-semibold">Click to toggle</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </Collapsible.CollapsibleTrigger>
        <Collapsible.CollapsibleContent className="mt-2">
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-13">This is the collapsible content that can be shown or hidden.</p>
          </div>
        </Collapsible.CollapsibleContent>
      </Collapsible.CollapsibleRoot>
    );
  },
} satisfies Meta<typeof Collapsible.CollapsibleRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DefaultOpen: Story = {
  args: { isOpen: true },
};

export const Controlled: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setIsOpen(true)} className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color">
            Open
          </button>
          <button onClick={() => setIsOpen(false)} className="rounded-sm bg-gray-500 px-4 py-2 text-13 text-on-color">
            Close
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-sm bg-green-500 px-4 py-2 text-13 text-on-color"
          >
            Toggle
          </button>
        </div>
        <Collapsible.CollapsibleRoot isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} className="w-96">
          <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
            <span className="font-semibold">Controlled Collapsible</span>
            <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
          </Collapsible.CollapsibleTrigger>
          <Collapsible.CollapsibleContent className="mt-2">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-13">This collapsible is controlled by external state.</p>
              <p className="mt-2 text-13">Current state: {isOpen ? "Open" : "Closed"}</p>
            </div>
          </Collapsible.CollapsibleContent>
        </Collapsible.CollapsibleRoot>
      </div>
    );
  },
};

export const NestedContent: Story = {
  render(args) {
    const [isOpen, setIsOpen] = useState(args.isOpen);
    return (
      <Collapsible.CollapsibleRoot {...args} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} className="w-96">
        <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
          <span className="font-semibold">Collapsible with Nested Content</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </Collapsible.CollapsibleTrigger>
        <Collapsible.CollapsibleContent className="mt-2">
          <div className="space-y-2 rounded-md border border-gray-200 p-4">
            <h4 className="font-semibold">Section 1</h4>
            <p className="text-13">This is some content in the first section.</p>
            <h4 className="font-semibold">Section 2</h4>
            <p className="text-13">This is some content in the second section.</p>
            <ul className="list-inside list-disc text-13">
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </div>
        </Collapsible.CollapsibleContent>
      </Collapsible.CollapsibleRoot>
    );
  },
};

export const CustomStyling: Story = {
  render(args) {
    const [isOpen, setIsOpen] = useState(args.isOpen);
    return (
      <Collapsible.CollapsibleRoot {...args} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} className="w-96">
        <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-on-color shadow-lg transition-all hover:shadow-xl">
          <span className="text-16 font-bold">Custom Styled Trigger</span>
          <ChevronDownIcon className="h-5 w-5 transition-transform group-data-[panel-open]:rotate-180" />
        </Collapsible.CollapsibleTrigger>
        <Collapsible.CollapsibleContent className="mt-4">
          <div className="rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 p-6 shadow-md">
            <p className="text-purple-900">This collapsible has custom styling with gradients, shadows, and colors.</p>
          </div>
        </Collapsible.CollapsibleContent>
      </Collapsible.CollapsibleRoot>
    );
  },
};

export const MultipleCollapsibles: Story = {
  render() {
    return (
      <div className="w-96 space-y-2">
        <Collapsible.CollapsibleRoot>
          <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
            <span className="font-semibold">First Item</span>
            <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
          </Collapsible.CollapsibleTrigger>
          <Collapsible.CollapsibleContent className="mt-2">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-13">Content for the first item.</p>
            </div>
          </Collapsible.CollapsibleContent>
        </Collapsible.CollapsibleRoot>

        <Collapsible.CollapsibleRoot>
          <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
            <span className="font-semibold">Second Item</span>
            <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
          </Collapsible.CollapsibleTrigger>
          <Collapsible.CollapsibleContent className="mt-2">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-13">Content for the second item.</p>
            </div>
          </Collapsible.CollapsibleContent>
        </Collapsible.CollapsibleRoot>

        <Collapsible.CollapsibleRoot>
          <Collapsible.CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
            <span className="font-semibold">Third Item</span>
            <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
          </Collapsible.CollapsibleTrigger>
          <Collapsible.CollapsibleContent className="mt-2">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-13">Content for the third item.</p>
            </div>
          </Collapsible.CollapsibleContent>
        </Collapsible.CollapsibleRoot>
      </div>
    );
  },
};
