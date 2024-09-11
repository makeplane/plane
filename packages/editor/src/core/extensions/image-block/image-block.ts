import { UploadImage, DeleteImage, RestoreImage } from "@/types";
import { mergeAttributes, Range } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
import { UploadImageExtensionStorage } from "../image-upload";
import { ImageUpload } from "../image-upload/view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attributes: { src: string; width?: number; height?: number }) => ReturnType;
      setImageBlockAt: (attributes: {
        src: string;
        pos: number | Range;
        width?: number;
        height?: number;
      }) => ReturnType;
    };
  }
}

export const ImageBlock = ({
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
    name: "imageBlock",
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
          tag: "image-block",
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return ["image-block", mergeAttributes(HTMLAttributes)];
    },

    addStorage() {
      return {
        fileMap: new Map(),
      };
    },

    addCommands() {
      return {
        setImageBlock:
          (attrs) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: { src: attrs.src },
            }),
        setImageBlockAt:
          (attrs) =>
          ({ commands }) =>
            commands.insertContentAt(attrs.pos, {
              type: this.name,
              attrs: { src: attrs.src },
            }),
        setImageUpload:
          (props: { file?: File; pos?: number; event: "insert" | "replace" | "drop" }) =>
          ({ commands }) => {
            const fileId = uuidv4();
            if (props?.file && props?.event === "drop") {
              (this.editor.storage.imageBlock as UploadImageExtensionStorage).fileMap.set(fileId, {
                file: props.file,
                event: props.event,
              });
            } else if (props.event !== "drop") {
              (this.editor.storage.imageBlock as UploadImageExtensionStorage).fileMap.set(fileId, {
                event: props.event,
              });
            }
            return commands.insertContent(
              `<image-block data-type="${this.name}" id="${fileId}" ${props?.file ? `data-file="${props.file}"` : ""} />`
            );
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

export default ImageBlock;
