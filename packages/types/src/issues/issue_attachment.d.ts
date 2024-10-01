import { TFileMetaData, TFileSignedURLResponse } from "../file";

export type TAttachmentUploadMetaData = Pick<TFileMetaData, "name" | "size" | "type">;

export type TIssueAttachment = {
  id: string;
  attributes: {
    name: string;
    size: number;
  };
  asset: string;
  issue_id: string;
  // required
  updated_at: string;
  updated_by: string;
};

export type TIssueAttachmentUploadResponse = TFileSignedURLResponse & {
  attachment: TIssueAttachment
};

export type TIssueAttachmentMap = {
  [issue_id: string]: TIssueAttachment;
};

export type TIssueAttachmentIdMap = {
  [issue_id: string]: string[];
};
