import { ReactNodeViewRenderer } from "@tiptap/react";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import type { TFileHandler, TReadOnlyFileHandler } from "@/types";
// local imports
import { CustomImageNodeView } from "../custom-image/components/node-view";
import { ImageExtensionConfig } from "./extension-config";

export type ImageExtensionStorage = {
  deletedImageSet: Map<string, boolean>;
};

type Props = {
  fileHandler: TFileHandler | TReadOnlyFileHandler;
};

export const ImageExtension = (props: Props) => {
  const { fileHandler } = props;
  // derived values
  const { getAssetSrc } = fileHandler;

  return ImageExtensionConfig.extend({
    addOptions() {
      return {
        ...this.parent?.(),
        getImageSource: getAssetSrc,
        isMobile: false,
      };
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    // storage to keep track of image states Map<src, isDeleted>
    addStorage() {
      const maxFileSize = "validation" in fileHandler ? fileHandler.validation?.maxFileSize : 0;

      return {
        deletedImageSet: new Map<string, boolean>(),
        maxFileSize,
      };
    },

    // render custom image node
    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNodeView);
    },
  });
};
