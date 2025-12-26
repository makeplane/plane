import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Edit, Share, Star, Archive } from "lucide-react";
import { CopyIcon, TrashIcon } from "../icons";
import { ChevronRightIcon } from "../icons/arrows/chevron-right";
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
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-strong text-13">
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
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-strong text-13">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <CopyIcon className="mr-2 h-4 w-4" />
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
              <TrashIcon className="mr-2 h-4 w-4 text-danger-primary" />
              <span className="text-danger-primary">Delete</span>
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
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-strong text-13">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <CopyIcon className="mr-2 h-4 w-4" />
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
                <ChevronRightIcon className="ml-auto h-4 w-4" />
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
              <TrashIcon className="mr-2 h-4 w-4 text-danger-primary" />
              <span className="text-danger-primary">Delete</span>
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
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-strong text-13">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <CopyIcon className="mr-2 h-4 w-4" />
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
              <TrashIcon className="mr-2 h-4 w-4 text-danger-primary" />
              <span className="text-danger-primary">Delete</span>
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
          <div className="w-64 p-4 border border-subtle rounded-lg hover:bg-layer-1 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent-primary rounded-sm flex items-center justify-center text-on-color text-16">
                📄
              </div>
              <div className="flex-1">
                <div className="font-medium">Document.pdf</div>
                <div className="text-13 text-placeholder">2.4 MB</div>
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
              <CopyIcon className="mr-2 h-4 w-4" />
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
              <TrashIcon className="mr-2 h-4 w-4 text-danger-primary" />
              <span className="text-danger-primary">Delete</span>
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
          <div className="relative w-80 h-56 bg-layer-1 rounded-lg overflow-hidden cursor-pointer">
            <div className="absolute inset-0 flex items-center justify-center text-placeholder">Image Placeholder</div>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <Download className="mr-2 h-4 w-4" />
              Save Image
            </ContextMenu.Item>
            <ContextMenu.Item>
              <CopyIcon className="mr-2 h-4 w-4" />
              Copy Image
            </ContextMenu.Item>
            <ContextMenu.Item>
              <CopyIcon className="mr-2 h-4 w-4" />
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
          <div className="w-96 p-6 border border-subtle rounded-lg">
            <h3 className="text-16 font-semibold mb-2">Context Menu on Text</h3>
            <p className="text-tertiary">
              Right click anywhere on this text area to see the context menu. This demonstrates how context menus can be
              applied to text content areas.
            </p>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <CopyIcon className="mr-2 h-4 w-4" />
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
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-strong text-13">
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
                <ChevronRightIcon className="ml-auto h-4 w-4" />
              </ContextMenu.SubmenuTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Content>
                  <ContextMenu.Item>From File</ContextMenu.Item>
                  <ContextMenu.Item>From URL</ContextMenu.Item>
                  <ContextMenu.Submenu>
                    <ContextMenu.SubmenuTrigger>
                      From Cloud
                      <ChevronRightIcon className="ml-auto h-4 w-4" />
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
              <TrashIcon className="mr-2 h-4 w-4 text-danger-primary" />
              <span className="text-danger-primary">Delete</span>
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
          <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-strong text-13">
            Right click here
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item>
              <CopyIcon className="mr-2 h-4 w-4" />
              Copy
              <span className="ml-auto text-11 text-placeholder">⌘C</span>
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Edit className="mr-2 h-4 w-4" />
              Edit
              <span className="ml-auto text-11 text-placeholder">⌘E</span>
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Download className="mr-2 h-4 w-4" />
              Download
              <span className="ml-auto text-11 text-placeholder">⌘D</span>
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item>
              <TrashIcon className="mr-2 h-4 w-4 text-danger-primary" />
              <span className="text-danger-primary">Delete</span>
              <span className="ml-auto text-11 text-placeholder">⌘⌫</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    );
  },
};
