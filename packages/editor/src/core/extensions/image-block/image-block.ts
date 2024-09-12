import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
import { UploadImage, DeleteImage, RestoreImage } from "@/types";

import { UploadImageExtensionStorage } from "../image-upload";
import { ImageUpload } from "../image-upload/view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageComponent: {
      setImageUpload: ({ file, pos, event }: { file?: File; pos?: number; event: "insert" | "drop" }) => ReturnType;
      uploadImage: (file: File) => () => Promise<string> | undefined;
    };
  }
}

export const CustomImageComponent = ({
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
  Image.extend<{}, UploadImageExtensionStorage>({
    name: "imageComponent",
    group: "inline",
    draggable: true,

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
          tag: "image-component",
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return ["image-component", mergeAttributes(HTMLAttributes)];
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
            if (props?.event === "drop" && props.file) {
              (this.editor.storage.imageComponent as UploadImageExtensionStorage).fileMap.set(fileId, {
                file: props.file,
                event: props.event,
              });
            } else if (props.event === "insert") {
              (this.editor.storage.imageComponent as UploadImageExtensionStorage).fileMap.set(fileId, {
                event: props.event,
              });
            }
            const attributes = {
              "data-type": this.name,
              id: fileId,
              "data-file": props?.file ? `data-file="${props.file}"` : "",
            };

            if (props.pos) {
              return commands.insertContentAt(props.pos, {
                type: this.name,
                attrs: attributes,
              });
            }
            return commands.insertContent({
              type: this.name,
              attrs: attributes,
            });
          },
        uploadImage: (file: File) => async () => {
          const fileUrl = await uploadFile(file);
          return fileUrl;
        },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(ImageUpload);
    },
  }).configure({
    inline: true,
  });

export default CustomImageComponent;
