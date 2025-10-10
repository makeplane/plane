import { findParentNodeClosestToPos, type Predicate, ReactNodeViewRenderer } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// local imports
import { CustomCalloutBlock, type CustomCalloutNodeViewProps } from "./block";
import { CustomCalloutExtensionConfig } from "./extension-config";
import type { CustomCalloutExtensionOptions, CustomCalloutExtensionStorage } from "./types";
import { getStoredBackgroundColor, getStoredLogo } from "./utils";

export const CustomCalloutExtension = CustomCalloutExtensionConfig.extend<
  CustomCalloutExtensionOptions,
  CustomCalloutExtensionStorage
>({
  selectable: true,
  draggable: true,

  addCommands() {
    return {
      insertCallout:
        () =>
        ({ commands }) => {
          // get stored logo values and background color from the local storage
          const storedLogoValues = getStoredLogo();
          const storedBackgroundValue = getStoredBackgroundColor();

          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: CORE_EXTENSIONS.PARAGRAPH,
              },
            ],
            attrs: {
              ...storedLogoValues,
              "data-background": storedBackgroundValue,
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        try {
          const isParentNodeCallout: Predicate = (node) => node.type === this.type;
          const parentNodeDetails = findParentNodeClosestToPos($from, isParentNodeCallout);
          // Check if selection is empty and at the beginning of the callout
          if (empty && parentNodeDetails) {
            const isCursorAtCalloutBeginning = $from.pos === parentNodeDetails.start + 1;
            if (parentNodeDetails.node.content.size > 2 && isCursorAtCalloutBeginning) {
              editor.commands.setTextSelection(parentNodeDetails.pos - 1);
              return true;
            }
          }
        } catch (error) {
          console.error("Error in performing backspace action on callout", error);
        }
        return false; // Allow the default behavior if conditions are not met
      },
      ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
      ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <CustomCalloutBlock {...props} node={props.node as CustomCalloutNodeViewProps["node"]} />
    ));
  },
});
