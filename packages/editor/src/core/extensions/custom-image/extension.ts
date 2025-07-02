import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// constants
import { ACCEPTED_IMAGE_MIME_TYPES } from "@/constants/config";
// helpers
import { isFileValid } from "@/helpers/file";
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import type { TFileHandler, TReadOnlyFileHandler } from "@/types";
// local imports
import { CustomImageNodeView } from "./components/node-view";
import { CustomImageExtensionConfig } from "./extension-config";
import { getImageComponentImageFileMap } from "./utils";

type Props = {
  fileHandler: TFileHandler | TReadOnlyFileHandler;
  isEditable: boolean;
};

export const CustomImageExtension = (props: Props) => {
  const { fileHandler, isEditable } = props;
  // derived values
  const { getAssetSrc, getAssetDownloadSrc, restore: restoreImageFn } = fileHandler;

  return CustomImageExtensionConfig.extend({
    selectable: isEditable,
    draggable: isEditable,

    addOptions() {
      const upload = "upload" in fileHandler ? fileHandler.upload : undefined;

      return {
        ...this.parent?.(),
        getImageDownloadSource: getAssetDownloadSrc,
        getImageSource: getAssetSrc,
        restoreImage: restoreImageFn,
        uploadImage: upload,
      };
    },

    addStorage() {
      const maxFileSize = "validation" in fileHandler ? fileHandler.validation?.maxFileSize : 0;

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
                maxFileSize: this.storage.maxFileSize,
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
      };
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNodeView);
    },
  });
};
