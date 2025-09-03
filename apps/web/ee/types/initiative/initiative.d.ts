import {
  IUserLite,
  EIssueCommentAccessSpecifier,
  InitiativeReaction,
  TIssueActivityIssueDetail,
  InitiativeComment,
  TIssueActivityUserDetail,
  TIssueComment,
  TLogoProps,
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
  epic_ids: string[] | null;
  logo_props: TLogoProps | undefined;
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

export type TInitiativeComment = Pick<
  TIssueComment,
  | "id"
  | "actor"
  | "actor_detail"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "updated_by"
  | "attachments"
  | "comment_reactions"
  | "comment_stripped"
  | "comment_html"
  | "comment_json"
  | "external_id"
  | "external_source"
  | "access"
  | "workspace"
>;

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

export type TInitiativeIssueAnalytics = {
  backlog_issues: number;
  unstarted_issues: number;
  started_issues: number;
  completed_issues: number;
  cancelled_issues: number;
  overdue_issues: number;
};

export type TInitiativeUpdateAnalytics = {
  on_track_updates: number;
  at_risk_updates: number;
  off_track_updates: number;
};

export type TInitiativeAnalyticData = TInitiativeIssueAnalytics & TInitiativeUpdateAnalytics;

export type TInitiativeAnalyticDataWithCumulated = TInitiativeIssueAnalytics;

export type TInitiativeAnalytics = TInitiativeAnalyticData & {
  project: TInitiativeAnalyticData;
  epic: TInitiativeAnalyticData;
  total_count: TInitiativeAnalyticDataWithCumulated;
};

export type TInitiativeStats = {
  initiative_id: string;
  on_track_updates: number;
  at_risk_updates: number;
  off_track_updates: number;
};
