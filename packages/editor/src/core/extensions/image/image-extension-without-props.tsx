import ImageExt from "@tiptap/extension-image";
import { insertLineBelowImageAction } from "./utilities/insert-line-below-image";
import { insertLineAboveImageAction } from "./utilities/insert-line-above-image";

export const ImageExtensionWithoutProps = () =>
  ImageExt.extend({
    addKeyboardShortcuts() {
      return {
        ArrowDown: insertLineBelowImageAction,
        ArrowUp: insertLineAboveImageAction,
      };
    },

    // storage to keep track of image states Map<src, isDeleted>
    addStorage() {
      return {
        images: new Map<string, boolean>(),
        uploadInProgress: false,
      };
    },

    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: "35%",
        },
        height: {
          default: null,
        },
      };
    },
  });
