import { Editor } from "@tiptap/core";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// plane editor imports
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// local imports
import { EAttachmentBlockAttributeNames, TAttachmentBlockAttributes } from "./types";

export const DEFAULT_ATTACHMENT_BLOCK_ATTRIBUTES: TAttachmentBlockAttributes = {
  [EAttachmentBlockAttributeNames.SOURCE]: null,
  [EAttachmentBlockAttributeNames.ID]: null,
  [EAttachmentBlockAttributeNames.FILE_NAME]: null,
  [EAttachmentBlockAttributeNames.FILE_TYPE]: null,
  [EAttachmentBlockAttributeNames.FILE_SIZE]: null,
};

export const getAttachmentExtensionFileMap = (editor: Editor) =>
  getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.ATTACHMENT)?.fileMap;

export const getAttachmentExtensionErrorMap = (editor: Editor) =>
  getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.ATTACHMENT)?.errorMap;

export const getAttachmentBlockId = (id: string) => `editor-attachment-block-${id}`;
