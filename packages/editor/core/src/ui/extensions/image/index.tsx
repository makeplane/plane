import Image from "@tiptap/extension-image";
import TrackImageDeletionPlugin from "../../plugins/delete-image";
import UploadImagesPlugin from "../../plugins/upload-image";
import { DeleteImage } from "../../../types/delete-image";
import { ValidateImage } from "../../../types/validate-image";
import { imageValidationPlugin } from "../../plugins/validate-image";

const ImageExtension = (
  deleteImage: DeleteImage,
  validateImage?: ValidateImage,
  cancelUploadImage?: () => any,
) =>
  Image.extend({
    addProseMirrorPlugins() {
      return [
        UploadImagesPlugin(cancelUploadImage),
        TrackImageDeletionPlugin(deleteImage),
        imageValidationPlugin(validateImage),
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
