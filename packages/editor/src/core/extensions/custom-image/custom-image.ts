import { Editor, mergeAttributes } from "@tiptap/core";
import { Image as BaseImageExtension } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// constants
import { ACCEPTED_IMAGE_MIME_TYPES } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { CustomImageNode } from "@/extensions/custom-image";
// helpers
import { isFileValid } from "@/helpers/file";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import { TFileHandler } from "@/types";

export type InsertImageComponentProps = {
  file?: File;
  pos?: number;
  event: "insert" | "drop";
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_IMAGE]: {
      insertImageComponent: ({ file, pos, event }: InsertImageComponentProps) => ReturnType;
      uploadImage: (blockId: string, file: File) => () => Promise<string> | undefined;
      getImageSource?: (path: string) => () => Promise<string>;
      restoreImage: (src: string) => () => Promise<void>;
    };
  }
}

export const getImageComponentImageFileMap = (editor: Editor) =>
  getExtensionStorage(editor, CORE_EXTENSIONS.CUSTOM_IMAGE)?.fileMap;

export interface CustomImageExtensionStorage {
  fileMap: Map<string, UploadEntity>;
  deletedImageSet: Map<string, boolean>;
  maxFileSize: number;
}

export type UploadEntity = ({ event: "insert" } | { event: "drop"; file: File }) & { hasOpenedFileInputOnce?: boolean };

export const CustomImageExtension = (props: TFileHandler) => {
  const {
    getAssetSrc,
    upload,
    restore: restoreImageFn,
    validation: { maxFileSize },
  } = props;

  return BaseImageExtension.extend<Record<string, unknown>, CustomImageExtensionStorage>({
    name: CORE_EXTENSIONS.CUSTOM_IMAGE,
    selectable: true,
    group: "block",
    atom: true,
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

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addStorage() {
      return {
        fileMap: new Map(),
        deletedImageSet: new Map<string, boolean>(),
        maxFileSize,
        // escape markdown for images
        markdown: {
          serialize() {},
        },
      };
    },

    addCommands() {
      return {
        insertImageComponent:
          (props) =>
          ({ commands }) => {
            // Early return if there's an invalid file being dropped
            if (
              props?.file &&
              !isFileValid({
                acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
                file: props.file,
                maxFileSize,
                onError: (_error, message) => alert(message),
              })
            ) {
              return false;
            }

            // generate a unique id for the image to keep track of dropped
            // files' file data
            const fileId = uuidv4();

            const imageComponentImageFileMap = getImageComponentImageFileMap(this.editor);

            if (imageComponentImageFileMap) {
              if (props?.event === "drop" && props.file) {
                imageComponentImageFileMap.set(fileId, {
                  file: props.file,
                  event: props.event,
                });
              } else if (props.event === "insert") {
                imageComponentImageFileMap.set(fileId, {
                  event: props.event,
                  hasOpenedFileInputOnce: false,
                });
              }
            }

            const attributes = {
              id: fileId,
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
        uploadImage: (blockId, file) => async () => {
          const fileUrl = await upload(blockId, file);
          return fileUrl;
        },
        getImageSource: (path) => async () => await getAssetSrc(path),
        restoreImage: (src) => async () => {
          await restoreImageFn(src);
        },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
};
