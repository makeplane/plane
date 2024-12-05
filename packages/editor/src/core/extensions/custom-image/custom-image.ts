import { Editor, mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// extensions
import { CustomImageNode } from "@/extensions/custom-image";
// plugins
import { TrackImageDeletionPlugin, TrackImageRestorationPlugin, isFileValid } from "@/plugins/image";
// types
import { TFileHandler } from "@/types";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";

export type InsertImageComponentProps = {
  file?: File;
  pos?: number;
  event: "insert" | "drop";
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageComponent: {
      insertImageComponent: ({ file, pos, event }: InsertImageComponentProps) => ReturnType;
      uploadImage: (file: File) => () => Promise<string> | undefined;
      getImageSource?: (path: string) => () => Promise<string>;
      restoreImage: (src: string) => () => Promise<void>;
    };
  }
}

export const getImageComponentImageFileMap = (editor: Editor) =>
  (editor.storage.imageComponent as UploadImageExtensionStorage | undefined)?.fileMap;

export interface UploadImageExtensionStorage {
  fileMap: Map<string, UploadEntity>;
}

export type UploadEntity = ({ event: "insert" } | { event: "drop"; file: File }) & { hasOpenedFileInputOnce?: boolean };

export const CustomImageExtension = (props: TFileHandler) => {
  const {
    getAssetSrc,
    upload,
    delete: deleteImageFn,
    restore: restoreImageFn,
    validation: { maxFileSize },
  } = props;

  return Image.extend<Record<string, unknown>, UploadImageExtensionStorage>({
    name: "imageComponent",
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

    addProseMirrorPlugins() {
      return [
        TrackImageDeletionPlugin(this.editor, deleteImageFn, this.name),
        TrackImageRestorationPlugin(this.editor, restoreImageFn, this.name),
      ];
    },

    onCreate(this) {
      const imageSources = new Set<string>();
      this.editor.state.doc.descendants((node) => {
        if (node.type.name === this.name) {
          if (!node.attrs.src?.startsWith("http")) return;

          imageSources.add(node.attrs.src);
        }
      });
      imageSources.forEach(async (src) => {
        try {
          await restoreImageFn(src);
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
        // escape markdown for images
        markdown: {
          serialize() {},
        },
      };
    },

    addCommands() {
      return {
        insertImageComponent:
          (props: { file?: File; pos?: number; event: "insert" | "drop" }) =>
          ({ commands }) => {
            // Early return if there's an invalid file being dropped
            if (
              props?.file &&
              !isFileValid({
                file: props.file,
                maxFileSize,
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
        uploadImage: (file: File) => async () => {
          const fileUrl = await upload(file);
          return fileUrl;
        },
        getImageSource: (path: string) => async () => await getAssetSrc(path),
        restoreImage: (src: string) => async () => {
          await restoreImageFn(src);
        },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
};
