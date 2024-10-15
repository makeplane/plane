import { ReactNodeViewRenderer } from "@tiptap/react";
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
          // get store logo values from the local storage
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
        try {
          const { selection } = editor.state;
          const { $from } = selection;

          const isCurrentNodeCallout = editor.isActive("calloutComponent");
          const nodeBefore = $from.nodeBefore;

          console.log("isCurrentNodeCallout", isCurrentNodeCallout);
          console.log("nodeBefore", nodeBefore);
          console.log("$from.parent", $from.parent);
          console.log("editor", editor);

          if (isCurrentNodeCallout && !nodeBefore) {
            console.log("Inside");
            // delete the callout
            // editor.commands.deleteRange({
            //   from: $from.pos - 1,
            //   to: $from.pos,
            // });
            editor.commands.setTextSelection(4);
            return true;
          }

          return false;
        } catch (error) {
          console.error("An error occurred while performing backspace action on a calloutComponent", error);
          return false;
        }
      },
      ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
      ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomCalloutBlock);
  },
});
