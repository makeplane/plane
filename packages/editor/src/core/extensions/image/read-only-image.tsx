import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
// extensions
import { CustomImageNode } from "@/extensions";
// types
import { TFileHandler } from "@/types";

export const ReadOnlyImageExtension = (props: Pick<TFileHandler, "getAssetSrc">) => {
  const { getAssetSrc } = props;

  return Image.extend({
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
