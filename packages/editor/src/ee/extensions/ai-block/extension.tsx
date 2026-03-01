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

import { findParentNodeClosestToPos, ReactNodeViewRenderer } from "@tiptap/react";
import type { Predicate } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// local imports
import { CustomAIBlock } from "./block";
import type { CustomAIBlockNodeViewProps } from "./block-ui";
import { CustomAIBlockExtensionConfig } from "./extension-config";
import type { CustomAIBlockExtensionProps, CustomAIBlockExtensionStorage } from "./types";

export const CustomAIBlockExtension = (props?: CustomAIBlockExtensionProps) =>
  CustomAIBlockExtensionConfig.extend<CustomAIBlockExtensionProps, CustomAIBlockExtensionStorage>({
    selectable: true,
    draggable: true,

    addOptions() {
      return {
        ...this.parent?.(),
        aiBlockHandlers: props?.aiBlockHandlers,
        aiBlockWidgetCallback: props?.aiBlockWidgetCallback,
        isFlagged: props?.isFlagged,
      };
    },

    addCommands() {
      return {
        insertAIBlock:
          () =>
          ({ commands, editor }) => {
            // Prevent nesting AI blocks inside AI blocks
            const { $from } = editor.state.selection;
            const isInsideAIBlock: Predicate = (node) => node.type.name === this.name;
            const parentAIBlock = findParentNodeClosestToPos($from, isInsideAIBlock);
            if (parentAIBlock) {
              return false;
            }

            return commands.insertContent({
              type: this.name,
              content: [
                {
                  type: CORE_EXTENSIONS.PARAGRAPH,
                },
              ],
            });
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        Backspace: ({ editor }) => {
          const { $from, empty } = editor.state.selection;
          try {
            const isParentNodeAIBlock: Predicate = (node) => node.type === this.type;
            const parentNodeDetails = findParentNodeClosestToPos($from, isParentNodeAIBlock);
            // Check if selection is empty and at the beginning of the AI block
            if (empty && parentNodeDetails) {
              const isCursorAtAIBlockBeginning = $from.pos === parentNodeDetails.start + 1;
              if (parentNodeDetails.node.content.size > 2 && isCursorAtAIBlockBeginning) {
                editor.commands.setTextSelection(parentNodeDetails.pos - 1);
                return true;
              }
            }
          } catch (error) {
            console.error("Error in performing backspace action on AI block", error);
          }
          return false; // Allow the default behavior if conditions are not met
        },
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((props) => (
        <CustomAIBlock
          {...props}
          node={props.node as CustomAIBlockNodeViewProps["node"]}
          extension={props.extension as CustomAIBlockNodeViewProps["extension"]}
        />
      ));
    },
  });
