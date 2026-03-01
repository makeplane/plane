/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import type { TFileHandler } from "@/types";
// local imports
import type { CustomAttachmentNodeViewProps } from "./components/node-view";
import { CustomAttachmentNodeView } from "./components/node-view";
import { CustomAttachmentExtensionConfig } from "./extension-config";
import type { AttachmentExtensionOptions, AttachmentExtensionStorage, TAttachmentBlockAttributes } from "./types";
import { EAttachmentBlockAttributeNames } from "./types";
import { DEFAULT_ATTACHMENT_BLOCK_ATTRIBUTES, getAttachmentExtensionFileMap } from "./utils";

type Props = {
  fileHandler: TFileHandler;
  isEditable: boolean;
  isFlagged: boolean;
  isVideoAttachmentsFlagged?: boolean;
};

export function CustomAttachmentExtension(props: Props) {
  const { fileHandler, isEditable, isFlagged, isVideoAttachmentsFlagged } = props;
  // derived values
  const { checkIfAssetExists, getAssetDownloadSrc, getAssetSrc, restore } = fileHandler;

  return CustomAttachmentExtensionConfig.extend<AttachmentExtensionOptions, AttachmentExtensionStorage>({
    selectable: isEditable,
    draggable: isEditable,

    addOptions() {
      const upload = "upload" in fileHandler ? fileHandler.upload : undefined;
      const duplicate = "duplicate" in fileHandler ? fileHandler.duplicate : undefined;

      return {
        checkIfAttachmentExists: checkIfAssetExists,
        getAttachmentDownloadSource: getAssetDownloadSrc,
        getAttachmentSource: getAssetSrc,
        isFlagged,
        isVideoAttachmentsFlagged,
        restoreAttachment: restore,
        uploadAttachment: upload,
        duplicateAttachment: duplicate,
      };
    },

    addStorage() {
      const maxFileSize = "validation" in fileHandler ? fileHandler.validation?.maxFileSize : 0;

      return {
        fileMap: new Map(),
        deletedAttachmentSet: new Map(),
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
            const { event, file, pos, preview, acceptedFileType } = props;
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
              [EAttachmentBlockAttributeNames.ID]: fileId,
              [EAttachmentBlockAttributeNames.PREVIEW]: preview ?? false,
              [EAttachmentBlockAttributeNames.ACCEPTED_FILE_TYPE]: acceptedFileType ?? "all",
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
      return ReactNodeViewRenderer((props) => (
        <CustomAttachmentNodeView {...props} node={props.node as CustomAttachmentNodeViewProps["node"]} />
      ));
    },
  });
}
