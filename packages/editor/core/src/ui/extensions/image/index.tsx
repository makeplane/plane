import Image from "@tiptap/extension-image";
import TrackImageDeletionPlugin from "../../plugins/delete-image";
import UploadImagesPlugin from "../../plugins/upload-image";
import { DeleteImage } from "../../../types/delete-image";

const ImageExtension = (
  deleteImage: DeleteImage,
  cancelUploadImage?: () => any,
) =>
  Image.extend({
    addProseMirrorPlugins() {
      return [
        UploadImagesPlugin(cancelUploadImage),
        TrackImageDeletionPlugin(deleteImage),
      ];
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

export default ImageExtension;
