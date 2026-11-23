/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { isValidCssColor } from "@/helpers/common";
// local imports
import { DEFAULT_COLUMN_WIDTH } from "./table";

type TableHeaderOptions = {
  HTMLAttributes: Record<string, unknown>;
};

export const TableHeader = Node.create<TableHeaderOptions>({
  name: CORE_EXTENSIONS.TABLE_HEADER,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: "block+",

  addAttributes() {
    return {
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: [DEFAULT_COLUMN_WIDTH],
        parseHTML: (element) => {
          const colwidth = element.getAttribute("colwidth");
          const value = colwidth ? [parseInt(colwidth, 10)] : null;

          return value;
        },
      },
      background: {
        default: "none",
      },
    };
  },

  tableRole: "header_cell",

  isolating: true,

  parseHTML() {
    return [{ tag: "th" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { background } = node.attrs;

    return [
      "th",
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        isValidCssColor(background) ? { style: `background-color: ${background};` } : {}
      ),
      0,
    ];
  },
});
