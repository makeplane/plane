export type TIssueAttachment = {
  id: string;
  created_at: string;
  updated_at: string;
  attributes: {
    name: string;
    size: number;
  };
  asset: string;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
};

export type TIssueAttachmentMap = {
  [issue_id: string]: TIssueAttachment;
};

export type TIssueAttachmentIdMap = {
  [issue_id: string]: string[];
};
