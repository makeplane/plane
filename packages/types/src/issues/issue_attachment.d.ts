export type TIssueAttachment = {
  id: string;
  attributes: {
    name: string;
    size: number;
  };
  asset: string;
  issue_id: string;

  //need
  updated_at: string;
  updated_by: string;
};

export type TIssueAttachmentMap = {
  [issue_id: string]: TIssueAttachment;
};

export type TIssueAttachmentIdMap = {
  [issue_id: string]: string[];
};
