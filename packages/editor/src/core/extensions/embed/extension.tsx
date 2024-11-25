import { ReactNodeViewRenderer } from "@tiptap/react";
// block
import { CustomEmbedBlock } from "./block";
// config
import { CustomEmbedExtensionConfig } from "./extension-config";
// types
import { EEmbedAttributeNames } from "./types";

export const CustomEmbedExtension = CustomEmbedExtensionConfig.extend({
  selectable: true,
  draggable: true,

  addCommands() {
    return {
      insertEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              [EEmbedAttributeNames.SOURCE]: "https://www.youtube.com/embed/z5rd-ZE2f3I?si=H9bkPwKyJtCXdRGW",
              [EEmbedAttributeNames.WIDTH]: "100%",
            },
          }),
    };
  },

  addKeyboardShortcuts() {
    return {};
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomEmbedBlock);
  },
});
