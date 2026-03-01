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

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// commands
import { columnListCommands } from "./commands";
// types
import {
  DEFAULT_COLUMN_LIST_ATTRIBUTES,
  EColumnAttributeNames,
  EColumnListAttributeNames,
  EColumnListNodeType,
} from "../types";
import type { TColumnListAttributes } from "../types";
import type { ColumnListNodeType } from "./types";
import { handleBackspaceInColumnList } from "./keyboard-shortcut";

export const ColumnList: ColumnListNodeType = Node.create<TColumnListAttributes>({
  name: ADDITIONAL_EXTENSIONS.COLUMN_LIST,
  group: "block",
  content: "column column+",
  defining: true,
  isolating: false,
  draggable: true,

  addAttributes() {
    return {
      [EColumnListAttributeNames.ID]: {
        default: DEFAULT_COLUMN_LIST_ATTRIBUTES[EColumnListAttributeNames.ID],
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes: TColumnListAttributes) =>
          attributes[EColumnListAttributeNames.ID] ? { "data-id": attributes[EColumnListAttributeNames.ID] } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${EColumnAttributeNames.NODE_TYPE}="${EColumnListNodeType.COLUMN_LIST}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        [EColumnAttributeNames.NODE_TYPE]: EColumnListNodeType.COLUMN_LIST,
        class: "editor-column-list horizontal-scrollbar scrollbar-sm",
      }),
      0,
    ];
  },

  addCommands() {
    return columnListCommands(this.type);
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        return handleBackspaceInColumnList(editor);
      },
    };
  },
});
