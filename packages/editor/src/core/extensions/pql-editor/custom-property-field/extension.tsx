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
import type { PQLCustomPropertyFieldExtensionAttributes } from "./types";
import type { PQLCustomPropertyFieldNodeViewProps } from "./node-view";
import { PQLCustomPropertyFieldNodeView } from "./node-view";
import { extractCustomPropertyFieldId } from "./utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pqlCustomPropertyField: {
      insertPQLCustomPropertyField: (props: Pick<PQLCustomPropertyFieldExtensionAttributes, "field">) => ReturnType;
    };
  }
}

export const PQLCustomPropertyFieldExtension = Node.create({
  name: "pqlCustomPropertyField",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      field: {
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
    const field = node.attrs.field as PQLCustomPropertyFieldExtensionAttributes["field"];
    if (!field) return "";
    // Emit the field as expected for a raw query
    return `cf["${String(extractCustomPropertyFieldId(field.value))}"]`;
  },

  addCommands() {
    return {
      insertPQLCustomPropertyField:
        (props) =>
        ({ commands }) => {
          const { field } = props;

          return commands.insertContent({
            type: this.name,
            attrs: { field },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => (
      <PQLCustomPropertyFieldNodeView {...props} node={props.node as PQLCustomPropertyFieldNodeViewProps["node"]} />
    ));
  },
});
