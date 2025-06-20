import { Image as BaseImageExtension } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import type { TFileHandler, TReadOnlyFileHandler } from "@/types";
// local imports
import { CustomImageNodeView } from "../custom-image/components/node-view";
import { CustomImageExtensionOptions } from "../custom-image/types";

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

  return BaseImageExtension.extend<Pick<CustomImageExtensionOptions, "getImageSource">, ImageExtensionStorage>({
    addOptions() {
      return {
        ...this.parent?.(),
        getImageSource: getAssetSrc,
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

    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: "35%",
        },
        height: {
          default: null,
        },
        aspectRatio: {
          default: null,
        },
      };
    },

    // render custom image node
    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNodeView);
    },
  });
};
