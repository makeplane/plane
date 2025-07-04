import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import { TFileHandler, TReadOnlyFileHandler } from "@/types";
// block
import { CustomAttachmentNodeView } from "./components/node-view";
// config
import { CustomAttachmentExtensionConfig } from "./extension-config";
// types
import { TAttachmentBlockAttributes } from "./types";
// utils
import { DEFAULT_ATTACHMENT_BLOCK_ATTRIBUTES, getAttachmentExtensionFileMap } from "./utils";

type Props = {
  fileHandler: TReadOnlyFileHandler | TFileHandler;
  isEditable: boolean;
  isFlagged: boolean;
};

export const CustomAttachmentExtension = (props: Props) => {
  const { fileHandler, isEditable, isFlagged } = props;
  // derived values
  const { checkIfAssetExists, getAssetSrc, restore } = fileHandler;

  return CustomAttachmentExtensionConfig.extend({
    selectable: isEditable,
    draggable: isEditable,

    addOptions() {
      const upload = "upload" in fileHandler ? fileHandler.upload : undefined;

      return {
        checkIfAttachmentExists: checkIfAssetExists,
        getAttachmentSource: getAssetSrc,
        isFlagged,
        restoreAttachment: restore,
        uploadAttachment: upload,
      };
    },

    addStorage() {
      const maxFileSize = "validation" in fileHandler ? fileHandler.validation?.maxFileSize : 0;

      return {
        fileMap: new Map(),
        deletedAttachmentSet: new Map(),
        errorMap: new Map(),
        maxFileSize,
        // escape markdown for attachments
        markdown: {
          serialize() {},
        },
      };
    },

    addCommands() {
      return {
        insertAttachmentComponent:
          (props) =>
          ({ commands }) => {
            const { event, file, pos } = props;
            // generate a unique id to keep track of dropped
            // files' data and for logging transactions
            const fileId = uuidv4();

            const attachmentExtensionFileMap = getAttachmentExtensionFileMap(this.editor);
            if (attachmentExtensionFileMap) {
              if (event === "drop" && file) {
                attachmentExtensionFileMap.set(fileId, {
                  file,
                  event,
                });
              } else if (event === "insert") {
                attachmentExtensionFileMap.set(fileId, {
                  event,
                  hasOpenedFileInputOnce: false,
                });
              }
            }
            // create default attributes
            const attributes: TAttachmentBlockAttributes = {
              ...DEFAULT_ATTACHMENT_BLOCK_ATTRIBUTES,
              id: fileId,
            };

            if (pos) {
              return commands.insertContentAt(pos, {
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
      return ReactNodeViewRenderer(CustomAttachmentNodeView);
    },
  });
};
