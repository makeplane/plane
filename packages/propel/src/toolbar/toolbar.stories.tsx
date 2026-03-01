/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import preview from "#.storybook/preview";
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

const meta = preview.meta({
  component: Toolbar,
  parameters: {
    layout: "padded",
  },
  args: {
    children: null,
  },
});

export const Default = meta.story({
  render(args) {
    return (
      <div className="w-96 border rounded-sm">
        <Toolbar {...args}>
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
    );
  },
});

export const WithActiveStates = meta.story({
  render(args) {
    return (
      <Toolbar {...args}>
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
    );
  },
});

export const CommentToolbar = meta.story({
  render(args) {
    return (
      <div className="rounded-sm border-[0.5px] border-subtle p-1">
        <Toolbar {...args}>
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
    );
  },
});

export const ItemWithoutTooltip = meta.story({
  render(args) {
    return (
      <Toolbar {...args}>
        <Toolbar.Group isFirst>
          <Toolbar.Item icon={Bold} />
          <Toolbar.Item icon={Italic} />
        </Toolbar.Group>
      </Toolbar>
    );
  },
});

export const WithSeparator = meta.story({
  render(args) {
    return (
      <Toolbar {...args}>
        <Toolbar.Group isFirst>
          <Toolbar.Item icon={Bold} tooltip="Bold" />
          <Toolbar.Separator />
          <Toolbar.Item icon={Italic} tooltip="Italic" />
        </Toolbar.Group>
      </Toolbar>
    );
  },
});

export const SubmitButtonLoading = meta.story({
  render(args) {
    return (
      <Toolbar {...args}>
        <Toolbar.Group isFirst>
          <Toolbar.Item icon={Bold} tooltip="Bold" />
        </Toolbar.Group>
        <Toolbar.SubmitButton loading>Submitting...</Toolbar.SubmitButton>
      </Toolbar>
    );
  },
});

export const SubmitButtonDisabled = meta.story({
  render(args) {
    return (
      <Toolbar {...args}>
        <Toolbar.Group isFirst>
          <Toolbar.Item icon={Bold} tooltip="Bold" />
        </Toolbar.Group>
        <Toolbar.SubmitButton disabled>Save</Toolbar.SubmitButton>
      </Toolbar>
    );
  },
});

export const SubmitButtonVariants = meta.story({
  render(args) {
    return (
      <Toolbar {...args}>
        <Toolbar.SubmitButton variant="primary">Primary</Toolbar.SubmitButton>
        <Toolbar.SubmitButton variant="secondary">Secondary</Toolbar.SubmitButton>
        <Toolbar.SubmitButton variant="outline">Outline</Toolbar.SubmitButton>
        <Toolbar.SubmitButton variant="ghost">Ghost</Toolbar.SubmitButton>
        <Toolbar.SubmitButton variant="destructive">Destructive</Toolbar.SubmitButton>
      </Toolbar>
    );
  },
});

export const CustomClassName = meta.story({
  args: {
    className: "bg-blue-100",
  },
  render(args) {
    return (
      <Toolbar {...args}>
        <Toolbar.Group className="border-blue-300" isFirst>
          <Toolbar.Item icon={Bold} tooltip="Bold" className="text-blue-600" />
        </Toolbar.Group>
        <Toolbar.Separator className="bg-blue-300" />
        <Toolbar.SubmitButton className="bg-blue-500" variant="primary">
          Save
        </Toolbar.SubmitButton>
      </Toolbar>
    );
  },
});
