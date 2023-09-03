import Image from "@tiptap/extension-image";
import TrackImageDeletionPlugin from "../plugins/delete-image";
import UploadImagesPlugin from "../plugins/upload-image";

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
