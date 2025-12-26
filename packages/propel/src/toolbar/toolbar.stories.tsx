import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from "lucide-react";
import { LinkIcon, GlobeIcon, LockIcon } from "../icons";
import { ListLayoutIcon } from "../icons/layouts/list-icon";
import { Toolbar } from "./toolbar";

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
        <div className="w-96 border rounded-sm">
          <Toolbar>
            <Toolbar.Group isFirst>
              <Toolbar.Item icon={Undo} tooltip="Undo" />
              <Toolbar.Item icon={Redo} tooltip="Redo" />
            </Toolbar.Group>
            <Toolbar.Group>
              <Toolbar.Item icon={Bold} tooltip="Bold" />
              <Toolbar.Item icon={Italic} tooltip="Italic" />
              <Toolbar.Item icon={Underline} tooltip="Underline" />
              <Toolbar.Item icon={Strikethrough} tooltip="Strikethrough" />
            </Toolbar.Group>
            <Toolbar.Group>
              <Toolbar.Item icon={ListLayoutIcon} tooltip="Bullet ListLayoutIcon" />
              <Toolbar.Item icon={ListOrdered} tooltip="Numbered ListLayoutIcon" />
              <Toolbar.Item icon={Quote} tooltip="Quote" />
            </Toolbar.Group>
            <Toolbar.Group>
              <Toolbar.Item icon={AlignLeft} tooltip="Align Left" />
              <Toolbar.Item icon={AlignCenter} tooltip="Align Center" />
              <Toolbar.Item icon={AlignRight} tooltip="Align Right" />
            </Toolbar.Group>
            <Toolbar.Group>
              <Toolbar.Item icon={LinkIcon} tooltip="Link" />
              <Toolbar.Item icon={Code} tooltip="Code" />
            </Toolbar.Group>
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
          <Toolbar.Group isFirst>
            <Toolbar.Item icon={Bold} tooltip="Bold" shortcut={["Cmd", "B"]} isActive />
            <Toolbar.Item icon={Italic} tooltip="Italic" shortcut={["Cmd", "I"]} />
            <Toolbar.Item icon={Underline} tooltip="Underline" shortcut={["Cmd", "U"]} isActive />
          </Toolbar.Group>
          <Toolbar.Group>
            <Toolbar.Item icon={ListLayoutIcon} tooltip="Bullet ListLayoutIcon" />
            <Toolbar.Item icon={ListOrdered} tooltip="Numbered ListLayoutIcon" isActive />
            <Toolbar.Item icon={Quote} tooltip="Quote" />
          </Toolbar.Group>
          <Toolbar.Group>
            <Toolbar.Item icon={AlignLeft} tooltip="Align Left" />
            <Toolbar.Item icon={AlignCenter} tooltip="Align Center" isActive />
            <Toolbar.Item icon={AlignRight} tooltip="Align Right" />
          </Toolbar.Group>
        </Toolbar>
      </div>
    );
  },
};

export const CommentToolbar: Story = {
  render() {
    return (
      <div className="p-4 space-y-4">
        <h3 className="text-13 font-medium">Comment Toolbar with Access Control</h3>
        <div className="rounded-sm border-[0.5px] border-subtle p-1">
          <Toolbar>
            {/* Access Specifier */}
            <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded-sm border-[0.5px] border-subtle p-1">
              <Toolbar.Item icon={LockIcon} tooltip="Private" isActive />
              <Toolbar.Item icon={GlobeIcon} tooltip="Public" />
            </div>

            <div className="flex w-full items-stretch justify-between gap-2 rounded-sm border-[0.5px] border-subtle p-1">
              <div className="flex items-stretch">
                <Toolbar.Group isFirst>
                  <Toolbar.Item icon={Bold} tooltip="Bold" shortcut={["Cmd", "B"]} />
                  <Toolbar.Item icon={Italic} tooltip="Italic" shortcut={["Cmd", "I"]} />
                  <Toolbar.Item icon={Code} tooltip="Code" shortcut={["Cmd", "`"]} />
                </Toolbar.Group>
                <Toolbar.Group>
                  <Toolbar.Item icon={ListLayoutIcon} tooltip="Bullet ListLayoutIcon" />
                  <Toolbar.Item icon={ListOrdered} tooltip="Numbered ListLayoutIcon" />
                </Toolbar.Group>
              </div>
              <Toolbar.SubmitButton>Comment</Toolbar.SubmitButton>
            </div>
          </Toolbar>
        </div>
      </div>
    );
  },
};
