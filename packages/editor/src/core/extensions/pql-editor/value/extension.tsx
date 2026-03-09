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

import type { NodeViewProps } from "@tiptap/core";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
// local imports
import type { PQLValueExtensionAttributes } from "./types";
import type { PQLValueNodeViewProps } from "./node-view";
import { PQLValueNodeView } from "./node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pqlValue: {
      insertPQLValue: (props: Pick<PQLValueExtensionAttributes, "option">) => ReturnType;
    };
  }
}

export const PQLValueExtension = Node.create({
  name: "pqlValue",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      option: {
        default: undefined,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type=${this.name}]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-type": this.name,
        },
        HTMLAttributes
      ),
    ];
  },

  renderText({ node }) {
    const option = node.attrs.option as PQLValueExtensionAttributes["option"];
    if (!option) return "";
    // Emit the value as a quoted PQL string literal followed by a space so the
    // next token is properly separated (mirrors how plain insertText is formatted).
    return `"${String(option.value ?? "")}" `;
  },

  addCommands() {
    return {
      insertPQLValue:
        (props) =>
        ({ commands }) => {
          const { option } = props;

          return commands.insertContent({
            type: this.name,
            attrs: { option },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => (
      <PQLValueNodeView {...props} node={props.node as PQLValueNodeViewProps["node"]} />
    ));
  },
});
