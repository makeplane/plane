import { findParentNodeClosestToPos, Predicate, ReactNodeViewRenderer } from "@tiptap/react";
// extensions
import { CustomCalloutBlock } from "@/extensions";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// config
import { CustomCalloutExtensionConfig } from "./extension-config";
// utils
import { getStoredBackgroundColor, getStoredLogo } from "./utils";

export const CustomCalloutExtension = CustomCalloutExtensionConfig.extend({
  selectable: true,
  draggable: true,

  addCommands() {
    return {
      insertCallout:
        () =>
        ({ commands }) => {
          // get store logo values and background color from the local storage
          const storedLogoValues = getStoredLogo();
          const storedBackgroundValue = getStoredBackgroundColor();

          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "paragraph",
              },
            ],
            attrs: {
              ...storedLogoValues,
              dataBackground: storedBackgroundValue,
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        const predicate: Predicate = (node) => node.type === this.type;
        const parentNodeDetails = findParentNodeClosestToPos($from, predicate);
        const isCursorAtCalloutBeginning = $from.pos === parentNodeDetails.start + 1;

        // Check if selection is empty and at the beginning of the callout
        if (empty && parentNodeDetails && parentNodeDetails.node.content.size > 2 && isCursorAtCalloutBeginning) {
          editor.commands.setTextSelection(parentNodeDetails.pos - 1);
          return true;
        }

        return false; // Allow the default behavior if conditions are not met
      },
      ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
      ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomCalloutBlock);
  },
});
