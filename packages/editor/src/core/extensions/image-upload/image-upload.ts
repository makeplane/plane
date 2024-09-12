import { mergeAttributes, Node, ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
import { DeleteImage, RestoreImage, UploadImage } from "@/types";
import { ImageUpload as ImageUploadComponent } from "./view/image-upload";

export interface UploadImageExtensionStorage {
  fileMap: Map<string, UploadEntity>;
}

export type UploadEntity = ({ event: "insert" } | { event: "drop"; file: File }) & {
  pos?: number;
};

export const ImageUpload = ({
  uploadFile,
  // deleteFile,
  // restoreFile,
  // cancelUploadImage,
}: {
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  restoreFile: RestoreImage;
  cancelUploadImage?: () => void;
}) =>
  Node.create<null, UploadImageExtensionStorage>({
    name: "imageUpload",

    isolating: true,

    defining: true,

    group: "block",

    draggable: true,

    selectable: true,

    inline: false,

    addAttributes() {
      return {
        ["data-type"]: {
          default: this.name,
        },
        ["data-file"]: {
          default: null,
        },
        ["id"]: {
          default: null,
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: "image-upload",
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return ["image-upload", mergeAttributes(HTMLAttributes)];
    },

    addStorage() {
      return {
        fileMap: new Map(),
      };
    },

    addCommands() {
      return {
        setImageUpload:
          (props: { file?: File; pos?: number; event: "insert" | "drop" }) =>
          ({ commands }) => {
            const fileId = uuidv4();
            if (props?.file && props?.event === "drop") {
              (this.editor.storage.imageComponent as UploadImageExtensionStorage).fileMap.set(fileId, {
                file: props.file,
                event: props.event,
              });
            } else if (props.event !== "drop") {
              (this.editor.storage.imageComponent as UploadImageExtensionStorage).fileMap.set(fileId, {
                event: props.event,
              });
            }
            return commands.insertContent(
              `<image-upload data-type="${this.name}" id="${fileId}" ${props?.file ? `data-file="${props.file}"` : ""} />`
            );
          },
        uploadImage: (file: File) => async () => {
          const fileUrl = await uploadFile(file);
          return fileUrl;
        },
        // restoreImage: (assetUrlWithWorkspaceId: string) => () => {
        //   restoreFile(assetUrlWithWorkspaceId);
        // },
        // deleteImage: (assetUrlWithWorkspaceId: string) => () => {
        //   deleteFile(assetUrlWithWorkspaceId);
        // },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(ImageUploadComponent);
    },
  });

export default ImageUpload;
