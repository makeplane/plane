import { Node } from "@tiptap/core";
// extensions
import { InsertImageComponentProps, UploadEntity } from "@/extensions/custom-image/types";
// helpers
import { EFileError } from "@/helpers/file";
// types
import { TFileHandler } from "@/types";

export enum EAttachmentBlockAttributeNames {
  ID = "id",
  SOURCE = "src",
  FILE_NAME = "data-name",
  FILE_TYPE = "data-file-type",
  FILE_SIZE = "data-file-size",
}

export type TAttachmentBlockAttributes = {
  [EAttachmentBlockAttributeNames.SOURCE]: string | null;
  [EAttachmentBlockAttributeNames.ID]: string | null;
  [EAttachmentBlockAttributeNames.FILE_NAME]: string | null;
  [EAttachmentBlockAttributeNames.FILE_TYPE]: string | null;
  [EAttachmentBlockAttributeNames.FILE_SIZE]: number | string | null;
};

export type InsertAttachmentComponentProps = InsertImageComponentProps;

export type AttachmentExtensionOptions = {
  checkIfAttachmentExists: TFileHandler["checkIfAssetExists"];
  getAttachmentSource: TFileHandler["getAssetSrc"];
  isFlagged: boolean;
  restoreAttachment: TFileHandler["restore"];
  uploadAttachment?: TFileHandler["upload"];
};

export type AttachmentExtensionStorage = {
  deletedAttachmentSet: Map<string, boolean>;
  fileMap: Map<string, UploadEntity>;
  errorMap: Map<string, { error: EFileError; file: File }>;
  maxFileSize: number;
};

export type AttachmentExtension = Node<AttachmentExtensionOptions, AttachmentExtensionStorage>;
