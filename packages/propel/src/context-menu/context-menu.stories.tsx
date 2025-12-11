import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Download, Edit, Share, Trash, Star, Archive } from "lucide-react";
import { ChevronRightIcon } from "../icons/arrows/chevron-right";
import { ContextMenu, ContextMenuTrigger, ContextMenuPortal, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSubmenu, ContextMenuSubmenuTrigger } from "./context-menu";

// cannot use satisfies here because base-ui does not have portable types.
const meta: Meta<typeof ContextMenu> = {
  title: "Components/ContextMenu",
  component: ContextMenu,
  subcomponents: {
    ContextMenuTrigger,
    ContextMenuPortal,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSubmenu,
    ContextMenuSubmenuTrigger,
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
        <ContextMenuTrigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>More Tools</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};

export const WithIcons: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Share className="mr-2 h-4 w-4" />
              Share
            </ContextMenuItem>
            <ContextMenuItem>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};

export const WithSubmenus: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSubmenu>
              <ContextMenuSubmenuTrigger>
                <Share className="mr-2 h-4 w-4" />
                Share
                <ChevronRightIcon className="ml-auto h-4 w-4" />
              </ContextMenuSubmenuTrigger>
              <ContextMenuPortal>
                <ContextMenuContent>
                  <ContextMenuItem>Email</ContextMenuItem>
                  <ContextMenuItem>Message</ContextMenuItem>
                  <ContextMenuItem>Copy Link</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenuPortal>
            </ContextMenuSubmenu>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};

export const DisabledItems: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem disabled>
              <Edit className="mr-2 h-4 w-4" />
              Edit (Disabled)
            </ContextMenuItem>
            <ContextMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem disabled>
              <Share className="mr-2 h-4 w-4" />
              Share (Disabled)
            </ContextMenuItem>
            <ContextMenuItem>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};

export const OnFileCard: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
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
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </ContextMenuItem>
            <ContextMenuItem>
              <Star className="mr-2 h-4 w-4" />
              Add to Favorites
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </ContextMenuItem>
            <ContextMenuItem>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};

export const OnImage: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="relative w-80 h-56 bg-custom-background-80 rounded-lg overflow-hidden cursor-pointer">
            <div className="absolute inset-0 flex items-center justify-center text-custom-text-400">
              Image Placeholder
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Save Image
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy Image
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy Image URL
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Open Image in New Tab</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};

export const OnText: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="w-96 p-6 border border-custom-border-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Context Menu on Text</h3>
            <p className="text-custom-text-300">
              Right click anywhere on this text area to see the context menu. This demonstrates how context menus can be
              applied to text content areas.
            </p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Select All</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};

export const NestedSubmenus: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>New File</ContextMenuItem>
            <ContextMenuItem>New Folder</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSubmenu>
              <ContextMenuSubmenuTrigger>
                Import
                <ChevronRightIcon className="ml-auto h-4 w-4" />
              </ContextMenuSubmenuTrigger>
              <ContextMenuPortal>
                <ContextMenuContent>
                  <ContextMenuItem>From File</ContextMenuItem>
                  <ContextMenuItem>From URL</ContextMenuItem>
                  <ContextMenuSubmenu>
                    <ContextMenuSubmenuTrigger>
                      From Cloud
                      <ChevronRightIcon className="ml-auto h-4 w-4" />
                    </ContextMenuSubmenuTrigger>
                    <ContextMenuPortal>
                      <ContextMenuContent>
                        <ContextMenuItem>Google Drive</ContextMenuItem>
                        <ContextMenuItem>Dropbox</ContextMenuItem>
                        <ContextMenuItem>OneDrive</ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenuPortal>
                  </ContextMenuSubmenu>
                </ContextMenuContent>
              </ContextMenuPortal>
            </ContextMenuSubmenu>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};

export const WithKeyboardShortcuts: Story = {
  render() {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy
              <span className="ml-auto text-xs text-custom-text-400">⌘C</span>
            </ContextMenuItem>
            <ContextMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
              <span className="ml-auto text-xs text-custom-text-400">⌘E</span>
            </ContextMenuItem>
            <ContextMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
              <span className="ml-auto text-xs text-custom-text-400">⌘D</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Trash className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Delete</span>
              <span className="ml-auto text-xs text-custom-text-400">⌘⌫</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  },
};
