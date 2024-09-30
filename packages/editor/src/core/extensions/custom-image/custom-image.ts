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
  const { upload, delete: deleteImage, restore: restoreImage } = props;

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

    onCreate(this) {
      const imageSources = new Set<string>();
      this.editor.state.doc.descendants((node) => {
        if (node.type.name === this.name) {
          imageSources.add(node.attrs.src);
        }
      });
      imageSources.forEach(async (src) => {
        try {
          const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
          await restoreImage(assetUrlWithWorkspaceId);
        } catch (error) {
          console.error("Error restoring image: ", error);
        }
      });
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addProseMirrorPlugins() {
      return [
        TrackImageDeletionPlugin(this.editor, deleteImage, this.name),
        TrackImageRestorationPlugin(this.editor, restoreImage, this.name),
      ];
    },

    addStorage() {
      return {
        fileMap: new Map(),
        deletedImageSet: new Map<string, boolean>(),
        uploadInProgress: false,
      };
    },

    addCommands() {
      return {
        insertImageComponent:
          (props: { file?: File; pos?: number; event: "insert" | "drop" }) =>
          ({ commands }) => {
            // Early return if there's an invalid file being dropped
            if (props?.file && !isFileValid(props.file)) {
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
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
};
