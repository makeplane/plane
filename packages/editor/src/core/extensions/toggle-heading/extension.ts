import { ReactNodeViewRenderer } from "@tiptap/react";
// components
import { CustomToggleHeadingBlock } from "./block";
// config
import { CustomToggleHeadingExtensionConfig } from "./extension-config";
// utils
import { DEFAULT_TOGGLE_HEADING_BLOCK_ATTRIBUTES } from "./utils";

export const CustomToggleHeadingExtension = CustomToggleHeadingExtensionConfig.extend({
  selectable: true,
  draggable: true,

  addCommands() {
    return {
      insertToggleHeading:
        ({ headingLevel }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [
              {
                type: "heading",
                attrs: {
                  level: headingLevel,
                },
              },
            ],
            attrs: {
              "data-heading-level": headingLevel ?? 1,
              "data-toggle-status": DEFAULT_TOGGLE_HEADING_BLOCK_ATTRIBUTES["data-toggle-status"],
            },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomToggleHeadingBlock);
  },
});
