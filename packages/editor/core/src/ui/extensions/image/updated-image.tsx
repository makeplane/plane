import Image from "@tiptap/extension-image";
import TrackImageDeletionPlugin from "@/ui/plugins/delete-image";
import UploadImagesPlugin from "@/ui/plugins/upload-image";
import { DeleteImage } from "@/types/delete-image";

const UpdatedImage = (deleteImage: DeleteImage) => Image.extend({
  addProseMirrorPlugins() {
    return [UploadImagesPlugin(), TrackImageDeletionPlugin(deleteImage)];
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

export default UpdatedImage;
