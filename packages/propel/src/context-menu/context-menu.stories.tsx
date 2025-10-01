import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Download, Edit, Share, Trash, ChevronRight, Star, Archive } from "lucide-react";
import { ContextMenu } from "./context-menu";

// cannot use satisfies here because base-ui does not have portable types.
const meta: Meta<typeof ContextMenu> = {
  title: "Components/ContextMenu",
  component: ContextMenu,
  subcomponents: {
    ContextMenuTrigger: ContextMenu.Trigger,
    ContextMenuPortal: ContextMenu.Portal,
    ContextMenuContent: ContextMenu.Content,
    ContextMenuItem: ContextMenu.Item,
    ContextMenuSeparator: ContextMenu.Separator,
    ContextMenuSubmenu: ContextMenu.Submenu,
    ContextMenuSubmenuTrigger: ContextMenu.SubmenuTrigger,
  },
  args: {
    children: null,
  },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>Back</ContextMenu.Item>
            <ContextMenu.Item>Forward</ContextMenu.Item>
            <ContextMenu.Item>Reload</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item>More Tools</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};

export const WithIcons: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Download className="mr-2 h-4 w-4" />
              Download
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item>
              <Share className="mr-2 h-4 w-4" />
              Share
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};

export const WithSubmenus: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Submenu>
              <ContextMenu.SubmenuTrigger>
                <Share className="mr-2 h-4 w-4" />
                Share
                <ChevronRight className="ml-auto h-4 w-4" />
              </ContextMenu.SubmenuTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Content>
                  <ContextMenu.Item>Email</ContextMenu.Item>
                  <ContextMenu.Item>Message</ContextMenu.Item>
                  <ContextMenu.Item>Copy Link</ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Submenu>
            <ContextMenu.Separator />
            <ContextMenu.Item>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};

export const DisabledItems: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenu.Item>
            <ContextMenu.Item disabled>
              <Edit className="mr-2 h-4 w-4" />
              Edit (Disabled)
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Download className="mr-2 h-4 w-4" />
              Download
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item disabled>
              <Share className="mr-2 h-4 w-4" />
              Share (Disabled)
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};

export const OnFileCard: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="w-64 p-4 border border-custom-border-200 rounded-lg hover:bg-custom-background-80 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-custom-primary-100 rounded flex items-center justify-center text-white text-lg">
                📄
              </div>
              <div className="flex-1">
                <div className="font-medium">Document.pdf</div>
                <div className="text-sm text-custom-text-400">2.4 MB</div>
              </div>
            </div>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <Download className="mr-2 h-4 w-4" />
              Download
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Star className="mr-2 h-4 w-4" />
              Add to Favorites
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};

export const OnImage: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="relative w-80 h-56 bg-custom-background-80 rounded-lg overflow-hidden cursor-pointer">
            <div className="absolute inset-0 flex items-center justify-center text-custom-text-400">
              Image Placeholder
            </div>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <Download className="mr-2 h-4 w-4" />
              Save Image
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Copy className="mr-2 h-4 w-4" />
              Copy Image
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Copy className="mr-2 h-4 w-4" />
              Copy Image URL
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item>Open Image in New Tab</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};

export const OnText: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="w-96 p-6 border border-custom-border-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Context Menu on Text</h3>
            <p className="text-custom-text-300">
              Right click anywhere on this text area to see the context menu. This demonstrates how context menus can be
              applied to text content areas.
            </p>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item>Select All</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};

export const NestedSubmenus: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>New File</ContextMenu.Item>
            <ContextMenu.Item>New Folder</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Submenu>
              <ContextMenu.SubmenuTrigger>
                Import
                <ChevronRight className="ml-auto h-4 w-4" />
              </ContextMenu.SubmenuTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Content>
                  <ContextMenu.Item>From File</ContextMenu.Item>
                  <ContextMenu.Item>From URL</ContextMenu.Item>
                  <ContextMenu.Submenu>
                    <ContextMenu.SubmenuTrigger>
                      From Cloud
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </ContextMenu.SubmenuTrigger>
                    <ContextMenu.Portal>
                      <ContextMenu.Content>
                        <ContextMenu.Item>Google Drive</ContextMenu.Item>
                        <ContextMenu.Item>Dropbox</ContextMenu.Item>
                        <ContextMenu.Item>OneDrive</ContextMenu.Item>
                      </ContextMenu.Content>
                    </ContextMenu.Portal>
                  </ContextMenu.Submenu>
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Submenu>
            <ContextMenu.Separator />
            <ContextMenu.Item>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};

export const WithKeyboardShortcuts: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <Copy className="mr-2 h-4 w-4" />
              Copy
              <span className="ml-auto text-xs text-custom-text-400">⌘C</span>
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Edit className="mr-2 h-4 w-4" />
              Edit
              <span className="ml-auto text-xs text-custom-text-400">⌘E</span>
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Download className="mr-2 h-4 w-4" />
              Download
              <span className="ml-auto text-xs text-custom-text-400">⌘D</span>
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
              <span className="ml-auto text-xs text-custom-text-400">⌘⌫</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};
