import {
  IUserLite,
  EIssueCommentAccessSpecifier,
  InitiativeReaction,
  TIssueActivityIssueDetail,
  InitiativeComment,
  TIssueActivityUserDetail,
} from "@plane/types";

export type TInitiative = {
  id: string;
  reactions?: InitiativeReaction[];
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  name: string;
  description: string | null;
  description_html: string | null;
  description_stripped: string | null;
  description_binary: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "PLANNED";
  created_by: string;
  updated_by: string | null;
  workspace: string;
  lead: string | null;
  project_ids: string[] | null;
};

export type TInitiativeProject = {
  id: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  sort_order: number;
  created_by: string;
  updated_by: string | null;
  initiative: string;
  project: string;
  workspace: string;
};

export type TInitiativeReaction = {
  id: string;
  reaction: string;
  actor: string;
  actor_detail: IUserLite;
};

export type TInitiativeLink = {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  title: string | null;
  url: string;
  metadata: any;
  created_by: string;
  updated_by: string | null;
  initiative: string;
  workspace: string;
};

export type TInitiativeAttachment = {
  id: string;
  attributes: {
    name: string;
    type: string;
    size: number;
  };
  asset_url: string;
  initiative: string;
  // required
  updated_at: string;
  updated_by: string;
};

export type TInitiativeComment = {
  id: string;
  actor_detail: IUserLite;
  comment_reactions: InitiativeReaction[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  comment_stripped: string | null;
  comment_json: any;
  comment_html: string | null;
  attachments: any[];
  access: EIssueCommentAccessSpecifier;
  external_id: string | undefined;
  external_source: string | undefined;
  created_by: string;
  updated_by: string | null;
  workspace: string;
  initiative: string;
  actor: string;
};

export type TInitiativePropertyAction = "created" | "updated" | "deleted";

export type TInitiativePropertiesActivity = {
  id: string | undefined;
  old_value: string | undefined;
  new_value: string | undefined;
  old_identifier: string | undefined;
  new_identifier: string | undefined;

  action: TInitiativePropertyAction | undefined;
  epoch: number | undefined;
  comment: string | undefined;

  initiative: string | undefined;
  property: string | undefined;
  actor: string | undefined;
  project: string | undefined;
  workspace: string | undefined;

  created_at: string | undefined;
  created_by: string | undefined;
  updated_at: string | undefined;
  updated_by: string | undefined;
};

export type TInitiativeActivity = {
  id: string;
  workspace: string;
  initiative: string;
  initiative_detail: TIssueActivityIssueDetail;
  actor: string;
  actor_detail: TIssueActivityUserDetail;
  created_at: string;
  updated_at: string;
  created_by: string | undefined;
  updated_by: string | undefined;
  attachments: any[];

  verb: string;
  field: string | undefined;
  old_value: string | undefined;
  new_value: string | undefined;
  comment: string | undefined;
  old_identifier: string | undefined;
  new_identifier: string | undefined;
  epoch: number;
  initiative_comment: string | null;
};

export type TInitiativeActivityComment =
  | {
      id: string;
      activity_type: "COMMENT";
      created_at?: string;
      detail: InitiativeComment;
    }
  | {
      id: string;
      activity_type: "ACTIVITY";
      created_at?: string;
      detail: TInitiativeActivity;
    };

export type TInitiativeAnalyticsGroup =
  | "backlog_issues"
  | "unstarted_issues"
  | "started_issues"
  | "completed_issues"
  | "cancelled_issues"
  | "overdue_issues";

export type TInitiativeAnalytics = {
  backlog_issues: number;
  unstarted_issues: number;
  started_issues: number;
  completed_issues: number;
  cancelled_issues: number;
  overdue_issues: number;
};

export type TInitiativeStats = {
  initiative_id: string;
  total_issues: number;
  completed_issues: number;
};
