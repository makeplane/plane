export type TIssueLinkEditableFields = {
  title: string;
  url: string;
};

export type TIssueLink = TIssueLinkEditableFields & {
  created_at: Date;
  created_by: string;
  created_by_detail: IUserLite;
  id: string;
  metadata: any;
};

export type TIssueLinkMap = {
  [issue_id: string]: TIssueLink;
};

export type TIssueLinkIdMap = {
  [issue_id: string]: string[];
};
