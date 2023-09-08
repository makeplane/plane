import Image from "@tiptap/extension-image";
import UploadImagesPlugin from "@/ui/editor/plugins/upload-image";
import TrackImageDeletionPlugin from "@/ui/editor/plugins/delete-image";

const UpdatedImage = Image.extend({
  addProseMirrorPlugins() {
    return [UploadImagesPlugin(), TrackImageDeletionPlugin()];
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
