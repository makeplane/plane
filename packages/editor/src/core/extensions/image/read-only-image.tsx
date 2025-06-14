import { Image as BaseImageExtension } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// extensions
import { CustomImageNode } from "@/extensions";
// types
import { TReadOnlyFileHandler } from "@/types";

export const ReadOnlyImageExtension = (props: TReadOnlyFileHandler) => {
  const { getAssetSrc } = props;

  return BaseImageExtension.extend({
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

    addCommands() {
      return {
        getImageSource: (path: string) => async () => await getAssetSrc(path),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
};
