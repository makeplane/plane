/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlignCenterOutline,
  AlignLeftOutline,
  AlignRightOutline,
  BoldOutline,
  CodeOutline,
  GlobeOutline,
  ItalicOutline,
  LinkOutline,
  ListOutline,
  LockOutline,
  NumberedListOutline,
  QuoteOutline,
  RedoOutline,
  StrikethroughOutline,
  UnderlineOutline,
  UndoOutline,
} from "@makeplane/propel/icons";
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
      <div className="space-y-4 p-4">
        <div className="w-96 rounded-sm border">
          <Toolbar>
            <Toolbar.Group isFirst>
              <Toolbar.Item icon={UndoOutline} tooltip="Undo" />
              <Toolbar.Item icon={RedoOutline} tooltip="Redo" />
            </Toolbar.Group>
            <Toolbar.Group>
              <Toolbar.Item icon={BoldOutline} tooltip="Bold" />
              <Toolbar.Item icon={ItalicOutline} tooltip="Italic" />
              <Toolbar.Item icon={UnderlineOutline} tooltip="Underline" />
              <Toolbar.Item icon={StrikethroughOutline} tooltip="Strikethrough" />
            </Toolbar.Group>
            <Toolbar.Group>
              <Toolbar.Item icon={ListOutline} tooltip="Bullet List" />
              <Toolbar.Item icon={NumberedListOutline} tooltip="Numbered List" />
              <Toolbar.Item icon={QuoteOutline} tooltip="Quote" />
            </Toolbar.Group>
            <Toolbar.Group>
              <Toolbar.Item icon={AlignLeftOutline} tooltip="Align Left" />
              <Toolbar.Item icon={AlignCenterOutline} tooltip="Align Center" />
              <Toolbar.Item icon={AlignRightOutline} tooltip="Align Right" />
            </Toolbar.Group>
            <Toolbar.Group>
              <Toolbar.Item icon={LinkOutline} tooltip="Link" />
              <Toolbar.Item icon={CodeOutline} tooltip="Code" />
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
            <Toolbar.Item icon={BoldOutline} tooltip="Bold" shortcut={["Cmd", "B"]} isActive />
            <Toolbar.Item icon={ItalicOutline} tooltip="Italic" shortcut={["Cmd", "I"]} />
            <Toolbar.Item icon={UnderlineOutline} tooltip="Underline" shortcut={["Cmd", "U"]} isActive />
          </Toolbar.Group>
          <Toolbar.Group>
            <Toolbar.Item icon={ListOutline} tooltip="Bullet List" />
            <Toolbar.Item icon={NumberedListOutline} tooltip="Numbered List" isActive />
            <Toolbar.Item icon={QuoteOutline} tooltip="Quote" />
          </Toolbar.Group>
          <Toolbar.Group>
            <Toolbar.Item icon={AlignLeftOutline} tooltip="Align Left" />
            <Toolbar.Item icon={AlignCenterOutline} tooltip="Align Center" isActive />
            <Toolbar.Item icon={AlignRightOutline} tooltip="Align Right" />
          </Toolbar.Group>
        </Toolbar>
      </div>
    );
  },
};

export const CommentToolbar: Story = {
  render() {
    return (
      <div className="space-y-4 p-4">
        <h3 className="text-13 font-medium">Comment Toolbar with Access Control</h3>
        <div className="rounded-sm border-[0.5px] border-subtle p-1">
          <Toolbar>
            {/* Access Specifier */}
            <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded-sm border-[0.5px] border-subtle p-1">
              <Toolbar.Item icon={LockOutline} tooltip="Private" isActive />
              <Toolbar.Item icon={GlobeOutline} tooltip="Public" />
            </div>

            <div className="flex w-full items-stretch justify-between gap-2 rounded-sm border-[0.5px] border-subtle p-1">
              <div className="flex items-stretch">
                <Toolbar.Group isFirst>
                  <Toolbar.Item icon={BoldOutline} tooltip="Bold" shortcut={["Cmd", "B"]} />
                  <Toolbar.Item icon={ItalicOutline} tooltip="Italic" shortcut={["Cmd", "I"]} />
                  <Toolbar.Item icon={CodeOutline} tooltip="Code" shortcut={["Cmd", "`"]} />
                </Toolbar.Group>
                <Toolbar.Group>
                  <Toolbar.Item icon={ListOutline} tooltip="Bullet List" />
                  <Toolbar.Item icon={NumberedListOutline} tooltip="Numbered List" />
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
