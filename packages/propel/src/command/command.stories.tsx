import type { Meta, StoryObj } from "@storybook/react-vite";
import { File, Folder, Settings, User } from "lucide-react";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "./command";

const meta = {
  title: "Components/Command",
  component: Command,
  subcomponents: {
    CommandInput,
    CommandList,
    CommandItem,
    CommandEmpty,
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
        <CommandInput placeholder="Search..." className="h-9 w-full bg-transparent py-3 text-sm outline-none" />
        <CommandList className="max-h-80 overflow-auto py-2">
          <CommandItem className="cursor-pointer rounded px-3 py-2 hover:bg-gray-100">Item 1</CommandItem>
          <CommandItem className="cursor-pointer rounded px-3 py-2 hover:bg-gray-100">Item 2</CommandItem>
          <CommandItem className="cursor-pointer rounded px-3 py-2 hover:bg-gray-100">Item 3</CommandItem>
        </CommandList>
        <CommandEmpty className="py-6 text-center text-sm text-gray-500">No results found.</CommandEmpty>
      </Command>
    );
  },
};

export const WithIcons: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <CommandInput
          placeholder="Search files and folders..."
          className="h-9 w-full bg-transparent py-3 text-sm outline-none"
        />
        <CommandList className="max-h-80 overflow-auto py-2">
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <Folder className="h-4 w-4" />
            <span>Documents</span>
          </CommandItem>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <Folder className="h-4 w-4" />
            <span>Downloads</span>
          </CommandItem>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <File className="h-4 w-4" />
            <span>README.md</span>
          </CommandItem>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <File className="h-4 w-4" />
            <span>package.json</span>
          </CommandItem>
        </CommandList>
        <CommandEmpty className="py-6 text-center text-sm text-gray-500">No files or folders found.</CommandEmpty>
      </Command>
    );
  },
};

export const WithCategories: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <CommandInput
          placeholder="Search commands..."
          className="h-9 w-full bg-transparent py-3 text-sm outline-none"
        />
        <CommandList className="max-h-80 overflow-auto py-2">
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">User</div>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </CommandItem>

          <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-gray-500">Files</div>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <Folder className="h-4 w-4" />
            <span>Open Folder</span>
          </CommandItem>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <File className="h-4 w-4" />
            <span>New File</span>
          </CommandItem>
        </CommandList>
        <CommandEmpty className="py-6 text-center text-sm text-gray-500">No commands found.</CommandEmpty>
      </Command>
    );
  },
};

export const EmptyState: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <CommandInput placeholder="Search..." className="h-9 w-full bg-transparent py-3 text-sm outline-none" />
        <CommandList className="max-h-80 overflow-auto py-2">{/* No items - will show empty state */}</CommandList>
        <CommandEmpty className="py-6 text-center text-sm text-gray-500">
          <p className="font-semibold">No results found</p>
          <p className="mt-1 text-xs">Try searching for something else</p>
        </CommandEmpty>
      </Command>
    );
  },
};

export const LongList: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <CommandInput placeholder="Search items..." className="h-9 w-full bg-transparent py-3 text-sm outline-none" />
        <CommandList className="max-h-60 overflow-auto py-2">
          {Array.from({ length: 20 }, (_, i) => (
            <CommandItem key={i} className="cursor-pointer rounded px-3 py-2 hover:bg-gray-100">
              Item {i + 1}
            </CommandItem>
          ))}
        </CommandList>
        <CommandEmpty className="py-6 text-center text-sm text-gray-500">No results found.</CommandEmpty>
      </Command>
    );
  },
};

export const WithoutSearch: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <CommandList className="max-h-80 overflow-auto py-2">
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-gray-100">
            <Folder className="h-4 w-4" />
            <span>Files</span>
          </CommandItem>
        </CommandList>
      </Command>
    );
  },
};

export const CustomStyling: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border-2 border-blue-300 bg-blue-50 p-2 shadow-lg">
        <CommandInput
          placeholder="Search with custom styling..."
          className="h-9 w-full bg-transparent py-3 text-sm text-blue-900 outline-none placeholder:text-blue-400"
        />
        <CommandList className="max-h-80 overflow-auto py-2">
          <CommandItem className="cursor-pointer rounded px-3 py-2 text-blue-900 hover:bg-blue-200">
            Custom Item 1
          </CommandItem>
          <CommandItem className="cursor-pointer rounded px-3 py-2 text-blue-900 hover:bg-blue-200">
            Custom Item 2
          </CommandItem>
          <CommandItem className="cursor-pointer rounded px-3 py-2 text-blue-900 hover:bg-blue-200">
            Custom Item 3
          </CommandItem>
        </CommandList>
        <CommandEmpty className="py-6 text-center text-sm text-blue-500">No matching items found.</CommandEmpty>
      </Command>
    );
  },
};

export const DisabledItems: Story = {
  render() {
    return (
      <Command className="w-96 rounded-lg border border-gray-200 p-2">
        <CommandInput placeholder="Search..." className="h-9 w-full bg-transparent py-3 text-sm outline-none" />
        <CommandList className="max-h-80 overflow-auto py-2">
          <CommandItem className="cursor-pointer rounded px-3 py-2 hover:bg-gray-100">Active Item 1</CommandItem>
          <CommandItem disabled className="cursor-not-allowed rounded px-3 py-2 opacity-50">
            Disabled Item
          </CommandItem>
          <CommandItem className="cursor-pointer rounded px-3 py-2 hover:bg-gray-100">Active Item 2</CommandItem>
        </CommandList>
        <CommandEmpty className="py-6 text-center text-sm text-gray-500">No results found.</CommandEmpty>
      </Command>
    );
  },
};
