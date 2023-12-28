export type TIssueLink = {
  created_at: Date;
  created_by: string;
  created_by_detail: IUserLite;
  id: string;
  metadata: any;
  title: string;
  url: string;
};

export type TIssueLinkMap = {
  [issue_id: string]: TIssueLink;
};

export type TIssueLinkIdMap = {
  [issue_id: string]: string[];
};
