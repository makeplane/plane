export type TIssueActivity = {
  access?: "EXTERNAL" | "INTERNAL";
  actor: string;
  actor_detail: IUserLite;
  attachments: any[];
  comment?: string;
  comment_html?: string;
  comment_stripped?: string;
  created_at: Date;
  created_by: string;
  field: string | null;
  id: string;
  issue: string | null;
  issue_comment?: string | null;
  issue_detail: {
    description_html: string;
    id: string;
    name: string;
    priority: string | null;
    sequence_id: string;
  } | null;
  new_identifier: string | null;
  new_value: string | null;
  old_identifier: string | null;
  old_value: string | null;
  project: string;
  project_detail: IProjectLite;
  updated_at: Date;
  updated_by: string;
  verb: string;
  workspace: string;
  workspace_detail?: IWorkspaceLite;
};

export type TIssueActivityMap = {
  [issue_id: string]: TIssueActivity;
};

export type TIssueActivityIdMap = {
  [issue_id: string]: string[];
};
