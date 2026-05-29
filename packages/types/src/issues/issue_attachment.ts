import type { TFileSignedURLResponse } from "../file";

export type TIssueAttachment = {
  id: string;
  attributes: {
    name: string;
    size: number;
  };
  asset_url: string;
  issue_id: string;
  // required
  updated_at: string;
  updated_by: string;
  created_by: string;
};

export type TIssueAttachmentUploadResponse = TFileSignedURLResponse & {
  attachment: TIssueAttachment;
};

export type TIssueAttachmentMap = {
  [issue_id: string]: TIssueAttachment;
};

export type TIssueAttachmentIdMap = {
  [issue_id: string]: string[];
};
