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

// editor
import type { TEditorCommands } from "@plane/editor";

export type ToolbarMenuItem = {
  key: TEditorCommands;
  name: string;
};

export const TYPOGRAPHY_ITEMS: ToolbarMenuItem[] = [
  { key: "text", name: "Text" },
  { key: "h1", name: "Heading 1" },
  { key: "h2", name: "Heading 2" },
  { key: "h3", name: "Heading 3" },
  { key: "h4", name: "Heading 4" },
  { key: "h5", name: "Heading 5" },
  { key: "h6", name: "Heading 6" },
];

const BASIC_MARK_ITEMS: ToolbarMenuItem[] = [
  { key: "bold", name: "Bold" },
  { key: "italic", name: "Italic" },
  { key: "underline", name: "Underline" },
  {
    key: "strikethrough",
    name: "Strikethrough",
  },
  {
    key: "link",
    name: "Link",
  },
];

const LIST_ITEMS: ToolbarMenuItem[] = [
  {
    key: "bulleted-list",
    name: "Bulleted list",
  },
  {
    key: "numbered-list",
    name: "Numbered list",
  },
  {
    key: "to-do-list",
    name: "To-do list",
  },
];

const USER_ACTION_ITEMS: ToolbarMenuItem[] = [
  { key: "quote", name: "Quote" },
  { key: "code", name: "Code" },
];

const COMPLEX_ITEMS: ToolbarMenuItem[] = [
  { key: "table", name: "Table" },
  { key: "image", name: "Image" },
];

export const TOOLBAR_ITEMS: {
  [key: string]: ToolbarMenuItem[];
} = {
  basic: BASIC_MARK_ITEMS,
  list: LIST_ITEMS,
  userAction: USER_ACTION_ITEMS,
  complex: COMPLEX_ITEMS,
};

export const EDITOR_PROPS = {
  scrollMargin: 80,
  scrollThreshold: 80,
};
