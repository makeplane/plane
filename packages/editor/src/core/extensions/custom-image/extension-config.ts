import { Editor, mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
// types
import { TFileHandler, TReadOnlyFileHandler } from "@/types";

export const getImageComponentImageFileMap = (editor: Editor) =>
  (editor.storage.imageComponent as UploadImageExtensionStorage | undefined)?.fileMap;

export interface UploadImageExtensionStorage {
  fileMap: Map<string, UploadEntity>;
}

export type UploadEntity = ({ event: "insert" } | { event: "drop"; file: File }) & { hasOpenedFileInputOnce?: boolean };

type Props = TReadOnlyFileHandler & Pick<TFileHandler, "validation">;

const fallbackProps: Props = {
  getAssetSrc: () => "",
  restore: async () => {},
  validation: {
    maxFileSize: 0,
  },
};

export const CustomImageExtensionConfig = (props: Props = fallbackProps) => {
  const {
    getAssetSrc,
    restore: restoreImage,
    validation: { maxFileSize },
  } = props;

  return Image.extend<Record<string, unknown>, UploadImageExtensionStorage>({
    name: "imageComponent",
    group: "block",
    atom: true,

    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: "35%",
        },
        src: {
          default: null,
        },
        height: {
          default: "auto",
        },
        ["id"]: {
          default: null,
        },
        aspectRatio: {
          default: null,
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: "image-component",
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return ["image-component", mergeAttributes(HTMLAttributes)];
    },

    onCreate(this) {
      const imageSources = new Set<string>();
      this.editor.state.doc.descendants((node) => {
        if (node.type.name === this.name) {
          imageSources.add(node.attrs.src);
        }
      });
      imageSources.forEach(async (src) => {
        try {
          await restoreImage(src);
        } catch (error) {
          console.error("Error restoring image: ", error);
        }
      });
    },

    addStorage() {
      return {
        fileMap: new Map(),
        deletedImageSet: new Map<string, boolean>(),
        uploadInProgress: false,
        maxFileSize,
      };
    },

    addCommands() {
      return {
        getImageSource: (path: string) => () => getAssetSrc(path),
      };
    },
  });
};
