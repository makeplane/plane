import { ReactNodeViewRenderer } from "@tiptap/react";
// constants
import type { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import type { TFileHandler } from "@/types";
// local imports
import type { CustomImageNodeViewProps } from "../custom-image/components/node-view";
import { CustomImageNodeView } from "../custom-image/components/node-view";
import { ImageExtensionConfig } from "./extension-config";

declare module "@tiptap/core" {
  interface Storage {
    [CORE_EXTENSIONS.IMAGE]: ImageExtensionStorage;
  }
}

export type ImageExtensionStorage = {
  deletedImageSet: Map<string, boolean>;
};

type Props = {
  fileHandler: TFileHandler;
};

export function ImageExtension(props: Props) {
  const { fileHandler } = props;
  // derived values
  const { getAssetSrc } = fileHandler;

  return ImageExtensionConfig.extend({
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

    // render custom image node
    addNodeView() {
      return ReactNodeViewRenderer((props) => (
        <CustomImageNodeView {...props} node={props.node as CustomImageNodeViewProps["node"]} />
      ));
    },
  });
}
