import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Globe2,
  Lock,
} from "lucide-react";
import { ListLayoutIcon } from "../icons/layouts/list-icon";
import { Toolbar, ToolbarGroup, ToolbarItem, ToolbarSeparator, ToolbarSubmitButton } from "./toolbar";

const meta = {
  title: "Components/Toolbar",
  component: Toolbar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    children: null,
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    return (
      <div className="p-4 space-y-4">
        <div className="w-96 border rounded">
          <Toolbar>
            <ToolbarGroup isFirst>
              <ToolbarItem icon={Undo} tooltip="Undo" />
              <ToolbarItem icon={Redo} tooltip="Redo" />
            </ToolbarGroup>
            <ToolbarGroup>
              <ToolbarItem icon={Bold} tooltip="Bold" />
              <ToolbarItem icon={Italic} tooltip="Italic" />
              <ToolbarItem icon={Underline} tooltip="Underline" />
              <ToolbarItem icon={Strikethrough} tooltip="Strikethrough" />
            </ToolbarGroup>
            <ToolbarGroup>
              <ToolbarItem icon={ListLayoutIcon} tooltip="Bullet ListLayoutIcon" />
              <ToolbarItem icon={ListOrdered} tooltip="Numbered ListLayoutIcon" />
              <ToolbarItem icon={Quote} tooltip="Quote" />
            </ToolbarGroup>
            <ToolbarGroup>
              <ToolbarItem icon={AlignLeft} tooltip="Align Left" />
              <ToolbarItem icon={AlignCenter} tooltip="Align Center" />
              <ToolbarItem icon={AlignRight} tooltip="Align Right" />
            </ToolbarGroup>
            <ToolbarGroup>
              <ToolbarItem icon={Link} tooltip="Link" />
              <ToolbarItem icon={Code} tooltip="Code" />
            </ToolbarGroup>
          </Toolbar>
        </div>
      </div>
    );
  },
};

export const WithActiveStates: Story = {
  render() {
    return (
      <div className="p-4">
        <Toolbar>
          <ToolbarGroup isFirst>
            <ToolbarItem icon={Bold} tooltip="Bold" shortcut={["Cmd", "B"]} isActive />
            <ToolbarItem icon={Italic} tooltip="Italic" shortcut={["Cmd", "I"]} />
            <ToolbarItem icon={Underline} tooltip="Underline" shortcut={["Cmd", "U"]} isActive />
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarItem icon={ListLayoutIcon} tooltip="Bullet ListLayoutIcon" />
            <ToolbarItem icon={ListOrdered} tooltip="Numbered ListLayoutIcon" isActive />
            <ToolbarItem icon={Quote} tooltip="Quote" />
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarItem icon={AlignLeft} tooltip="Align Left" />
            <ToolbarItem icon={AlignCenter} tooltip="Align Center" isActive />
            <ToolbarItem icon={AlignRight} tooltip="Align Right" />
          </ToolbarGroup>
        </Toolbar>
      </div>
    );
  },
};

export const CommentToolbar: Story = {
  render() {
    return (
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-medium">Comment Toolbar with Access Control</h3>
        <div className="rounded border-[0.5px] border-custom-border-200 p-1">
          <Toolbar>
            {/* Access Specifier */}
            <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded border-[0.5px] border-custom-border-200 p-1">
              <ToolbarItem icon={Lock} tooltip="Private" isActive />
              <ToolbarItem icon={Globe2} tooltip="Public" />
            </div>

            <div className="flex w-full items-stretch justify-between gap-2 rounded border-[0.5px] border-custom-border-200 p-1">
              <div className="flex items-stretch">
                <ToolbarGroup isFirst>
                  <ToolbarItem icon={Bold} tooltip="Bold" shortcut={["Cmd", "B"]} />
                  <ToolbarItem icon={Italic} tooltip="Italic" shortcut={["Cmd", "I"]} />
                  <ToolbarItem icon={Code} tooltip="Code" shortcut={["Cmd", "`"]} />
                </ToolbarGroup>
                <ToolbarGroup>
                  <ToolbarItem icon={ListLayoutIcon} tooltip="Bullet ListLayoutIcon" />
                  <ToolbarItem icon={ListOrdered} tooltip="Numbered ListLayoutIcon" />
                </ToolbarGroup>
              </div>
              <ToolbarSubmitButton>Comment</ToolbarSubmitButton>
            </div>
          </Toolbar>
        </div>
      </div>
    );
  },
};
