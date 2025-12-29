import type { Meta, StoryObj } from "@storybook/react-vite";
import { File, Folder, Settings, User } from "lucide-react";
import { Command } from "./command";

const meta = {
  title: "Components/Command",
  component: Command,
  subcomponents: {
    CommandInput: Command.Input,
    CommandList: Command.List,
    CommandItem: Command.Item,
    CommandEmpty: Command.Empty,
  },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <Command.Input placeholder="Search..." className="h-9 w-full bg-transparent py-3 text-13 outline-none" />
        <Command.List className="max-h-80 overflow-auto py-2">
          <Command.Item className="cursor-pointer rounded-sm px-3 py-2 hover:bg-gray-100">Item 1</Command.Item>
          <Command.Item className="cursor-pointer rounded-sm px-3 py-2 hover:bg-gray-100">Item 2</Command.Item>
          <Command.Item className="cursor-pointer rounded-sm px-3 py-2 hover:bg-gray-100">Item 3</Command.Item>
        </Command.List>
        <Command.Empty className="py-6 text-center text-13 text-gray-500">No results found.</Command.Empty>
      </Command>
    );
  },
};

export const WithIcons: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <Command.Input
          placeholder="Search files and folders..."
          className="h-9 w-full bg-transparent py-3 text-13 outline-none"
        />
        <Command.List className="max-h-80 overflow-auto py-2">
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <Folder className="h-4 w-4" />
            <span>Documents</span>
          </Command.Item>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <Folder className="h-4 w-4" />
            <span>Downloads</span>
          </Command.Item>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <File className="h-4 w-4" />
            <span>README.md</span>
          </Command.Item>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <File className="h-4 w-4" />
            <span>package.json</span>
          </Command.Item>
        </Command.List>
        <Command.Empty className="py-6 text-center text-13 text-gray-500">No files or folders found.</Command.Empty>
      </Command>
    );
  },
};

export const WithCategories: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <Command.Input
          placeholder="Search commands..."
          className="h-9 w-full bg-transparent py-3 text-13 outline-none"
        />
        <Command.List className="max-h-80 overflow-auto py-2">
          <div className="px-2 py-1.5 text-11 font-semibold text-gray-500">User</div>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Command.Item>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Command.Item>

          <div className="mt-2 px-2 py-1.5 text-11 font-semibold text-gray-500">Files</div>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <Folder className="h-4 w-4" />
            <span>Open Folder</span>
          </Command.Item>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <File className="h-4 w-4" />
            <span>New File</span>
          </Command.Item>
        </Command.List>
        <Command.Empty className="py-6 text-center text-13 text-gray-500">No commands found.</Command.Empty>
      </Command>
    );
  },
};

export const EmptyState: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <Command.Input placeholder="Search..." className="h-9 w-full bg-transparent py-3 text-13 outline-none" />
        <Command.List className="max-h-80 overflow-auto py-2">{/* No items - will show empty state */}</Command.List>
        <Command.Empty className="py-6 text-center text-13 text-gray-500">
          <p className="font-semibold">No results found</p>
          <p className="mt-1 text-11">Try searching for something else</p>
        </Command.Empty>
      </Command>
    );
  },
};

export const LongList: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <Command.Input placeholder="Search items..." className="h-9 w-full bg-transparent py-3 text-13 outline-none" />
        <Command.List className="max-h-60 overflow-auto py-2">
          {Array.from({ length: 20 }, (_, i) => (
            <Command.Item key={i} className="cursor-pointer rounded-sm px-3 py-2 hover:bg-gray-100">
              Item {i + 1}
            </Command.Item>
          ))}
        </Command.List>
        <Command.Empty className="py-6 text-center text-13 text-gray-500">No results found.</Command.Empty>
      </Command>
    );
  },
};

export const WithoutSearch: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <Command.List className="max-h-80 overflow-auto py-2">
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Command.Item>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Command.Item>
          <Command.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-gray-100">
            <Folder className="h-4 w-4" />
            <span>Files</span>
          </Command.Item>
        </Command.List>
      </Command>
    );
  },
};

export const CustomStyling: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border-2 border-blue-300 bg-blue-50 p-2 shadow-lg">
        <Command.Input
          placeholder="Search with custom styling..."
          className="h-9 w-full bg-transparent py-3 text-13 text-blue-900 outline-none placeholder:text-blue-400"
        />
        <Command.List className="max-h-80 overflow-auto py-2">
          <Command.Item className="cursor-pointer rounded-sm px-3 py-2 text-blue-900 hover:bg-blue-200">
            Custom Item 1
          </Command.Item>
          <Command.Item className="cursor-pointer rounded-sm px-3 py-2 text-blue-900 hover:bg-blue-200">
            Custom Item 2
          </Command.Item>
          <Command.Item className="cursor-pointer rounded-sm px-3 py-2 text-blue-900 hover:bg-blue-200">
            Custom Item 3
          </Command.Item>
        </Command.List>
        <Command.Empty className="py-6 text-center text-13 text-blue-500">No matching items found.</Command.Empty>
      </Command>
    );
  },
};

export const DisabledItems: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <Command.Input placeholder="Search..." className="h-9 w-full bg-transparent py-3 text-13 outline-none" />
        <Command.List className="max-h-80 overflow-auto py-2">
          <Command.Item className="cursor-pointer rounded-sm px-3 py-2 hover:bg-gray-100">Active Item 1</Command.Item>
          <Command.Item disabled className="cursor-not-allowed rounded-sm px-3 py-2 opacity-50">
            Disabled Item
          </Command.Item>
          <Command.Item className="cursor-pointer rounded-sm px-3 py-2 hover:bg-gray-100">Active Item 2</Command.Item>
        </Command.List>
        <Command.Empty className="py-6 text-center text-13 text-gray-500">No results found.</Command.Empty>
      </Command>
    );
  },
};
