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

import type { LucideIcon } from "lucide-react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CaseSensitive,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  Paperclip,
  Strikethrough,
  Table,
  TextQuote,
  Underline,
} from "lucide-react";
// plane imports
import type { TCommandExtraProps, TEditorCommands, TEditorFontStyle } from "@plane/editor";
import type { ISvgIcons } from "@plane/propel/icons";
import { MonospaceIcon, SansSerifIcon, SerifIcon } from "@plane/propel/icons";

type TEditorTypes = "lite" | "document" | "sticky";

// Utility type to enforce the necessary extra props or make extraProps optional
type ExtraPropsForCommand<T extends TEditorCommands> = T extends keyof TCommandExtraProps
  ? TCommandExtraProps[T]
  : object; // Default to empty object for commands without extra props

export type ToolbarMenuItem<T extends TEditorCommands = TEditorCommands> = {
  itemKey: T;
  renderKey: string;
  name: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
  shortcut?: string[];
  editors: TEditorTypes[];
  extraProps?: ExtraPropsForCommand<T>;
};

export const TYPOGRAPHY_ITEMS: ToolbarMenuItem<"text" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6">[] = [
  { itemKey: "text", renderKey: "text", name: "Text", icon: CaseSensitive, editors: ["document"] },
  { itemKey: "h1", renderKey: "h1", name: "Heading 1", icon: Heading1, editors: ["document"] },
  { itemKey: "h2", renderKey: "h2", name: "Heading 2", icon: Heading2, editors: ["document"] },
  { itemKey: "h3", renderKey: "h3", name: "Heading 3", icon: Heading3, editors: ["document"] },
  { itemKey: "h4", renderKey: "h4", name: "Heading 4", icon: Heading4, editors: ["document"] },
  { itemKey: "h5", renderKey: "h5", name: "Heading 5", icon: Heading5, editors: ["document"] },
  { itemKey: "h6", renderKey: "h6", name: "Heading 6", icon: Heading6, editors: ["document"] },
];

export const TEXT_ALIGNMENT_ITEMS: ToolbarMenuItem<"text-align">[] = [
  {
    itemKey: "text-align",
    renderKey: "text-align-left",
    name: "Left align",
    icon: AlignLeft,
    shortcut: ["Cmd", "Shift", "L"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "left",
    },
  },
  {
    itemKey: "text-align",
    renderKey: "text-align-center",
    name: "Center align",
    icon: AlignCenter,
    shortcut: ["Cmd", "Shift", "E"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "center",
    },
  },
  {
    itemKey: "text-align",
    renderKey: "text-align-right",
    name: "Right align",
    icon: AlignRight,
    shortcut: ["Cmd", "Shift", "R"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "right",
    },
  },
];

const BASIC_MARK_ITEMS: ToolbarMenuItem<"bold" | "italic" | "underline" | "strikethrough">[] = [
  {
    itemKey: "bold",
    renderKey: "bold",
    name: "Bold",
    icon: Bold,
    shortcut: ["Cmd", "B"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "italic",
    renderKey: "italic",
    name: "Italic",
    icon: Italic,
    shortcut: ["Cmd", "I"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "underline",
    renderKey: "underline",
    name: "Underline",
    icon: Underline,
    shortcut: ["Cmd", "U"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "strikethrough",
    renderKey: "strikethrough",
    name: "Strikethrough",
    icon: Strikethrough,
    shortcut: ["Cmd", "Shift", "S"],
    editors: ["lite", "document"],
  },
];

const LIST_ITEMS: ToolbarMenuItem<"bulleted-list" | "numbered-list" | "to-do-list">[] = [
  {
    itemKey: "numbered-list",
    renderKey: "numbered-list",
    name: "Numbered list",
    icon: ListOrdered,
    shortcut: ["Cmd", "Shift", "7"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "bulleted-list",
    renderKey: "bulleted-list",
    name: "Bulleted list",
    icon: List,
    shortcut: ["Cmd", "Shift", "8"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "to-do-list",
    renderKey: "to-do-list",
    name: "To-do list",
    icon: ListTodo,
    shortcut: ["Cmd", "Shift", "9"],
    editors: ["lite", "document"],
  },
];

const USER_ACTION_ITEMS: ToolbarMenuItem<"quote" | "code">[] = [
  { itemKey: "quote", renderKey: "quote", name: "Quote", icon: TextQuote, editors: ["lite", "document"] },
  { itemKey: "code", renderKey: "code", name: "Code", icon: Code2, editors: ["lite", "document"] },
];

export const IMAGE_ITEM = {
  itemKey: "image",
  renderKey: "image",
  name: "Image",
  icon: Image,
  editors: ["lite", "document"],
  extraProps: {},
} as ToolbarMenuItem<"image">;

export const ATTACHMENT_ITEM = {
  itemKey: "attachment",
  renderKey: "attachment",
  name: "Attachment",
  icon: Paperclip,
  editors: ["lite", "document"],
  extraProps: {},
} as ToolbarMenuItem<"attachment">;

const COMPLEX_ITEMS: ToolbarMenuItem<"table" | "image" | "attachment">[] = [
  { itemKey: "table", renderKey: "table", name: "Table", icon: Table, editors: ["document"] },
  IMAGE_ITEM,
  ATTACHMENT_ITEM,
];

export const TOOLBAR_ITEMS: {
  [editorType in TEditorTypes]: {
    [key: string]: ToolbarMenuItem<TEditorCommands>[];
  };
} = {
  lite: {
    basic: BASIC_MARK_ITEMS.filter((item) => item.editors.includes("lite")),
    alignment: TEXT_ALIGNMENT_ITEMS.filter((item) => item.editors.includes("lite")),
    list: LIST_ITEMS.filter((item) => item.editors.includes("lite")),
    userAction: USER_ACTION_ITEMS.filter((item) => item.editors.includes("lite")),
    complex: COMPLEX_ITEMS.filter((item) => item.editors.includes("lite")),
  },
  document: {
    basic: BASIC_MARK_ITEMS.filter((item) => item.editors.includes("document")),
    alignment: TEXT_ALIGNMENT_ITEMS.filter((item) => item.editors.includes("document")),
    list: LIST_ITEMS.filter((item) => item.editors.includes("document")),
    userAction: USER_ACTION_ITEMS.filter((item) => item.editors.includes("document")),
    complex: COMPLEX_ITEMS.filter((item) => item.editors.includes("document")),
  },
  sticky: {
    basic: BASIC_MARK_ITEMS.filter((item) => ["Bold", "Italic"].includes(item.name)),
    list: LIST_ITEMS.filter((item) => ["To-do list"].includes(item.name)),
  },
};

export const EDITOR_FONT_STYLES: {
  key: TEditorFontStyle;
  label: string;
  icon: any;
}[] = [
  {
    key: "sans-serif",
    label: "Sans serif",
    icon: SansSerifIcon,
  },
  {
    key: "serif",
    label: "Serif",
    icon: SerifIcon,
  },
  {
    key: "monospace",
    label: "Mono",
    icon: MonospaceIcon,
  },
];
