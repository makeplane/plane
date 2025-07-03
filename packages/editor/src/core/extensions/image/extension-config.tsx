import { Image as BaseImageExtension } from "@tiptap/extension-image";
// local imports
import { CustomImageExtensionOptions } from "../custom-image/types";
import { ImageExtensionStorage } from "./extension";

export const ImageExtensionConfig = BaseImageExtension.extend<
  Pick<CustomImageExtensionOptions, "getImageSource">,
  ImageExtensionStorage
>({
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
      alignment: {
        default: "left",
      },
    };
  },
});
