import Image from "@tiptap/extension-image";
import TrackImageDeletionPlugin from "@/ui/editor/plugins/delete-image";
import UploadImagesPlugin from "@/ui/editor/plugins/upload-image";
import { DeleteFileFunction } from "@/types/delete-file";

const UpdatedImage = (deleteImage: DeleteFileFunction) => Image.extend({
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
