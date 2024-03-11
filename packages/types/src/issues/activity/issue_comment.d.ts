import {
  TIssueActivityWorkspaceDetail,
  TIssueActivityProjectDetail,
  TIssueActivityIssueDetail,
  TIssueActivityUserDetail,
} from "./base";

export type TIssueComment = {
  id: string;
  workspace: string;
  workspace_detail: TIssueActivityWorkspaceDetail;
  project: string;
  project_detail: TIssueActivityProjectDetail;
  issue: string;
  issue_detail: TIssueActivityIssueDetail;
  actor: string;
  actor_detail: TIssueActivityUserDetail;
  created_at: string;
  updated_at: string;
  created_by: string | undefined;
  updated_by: string | undefined;
  attachments: any[];

  comment_reactions: any[];
  comment_stripped: string;
  comment_html: string;
  comment_json: object;
  external_id: string | undefined;
  external_source: string | undefined;
  access: "EXTERNAL" | "INTERNAL";
};

export type TIssueCommentMap = {
  [issue_id: string]: TIssueComment;
};

export type TIssueCommentIdMap = {
  [issue_id: string]: string[];
};
