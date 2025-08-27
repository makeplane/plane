import { ExIssueType } from "./issue-types";

// service types
export type ClientOptions = {
  baseURL: string;
  apiToken?: string;
  bearerToken?: string;
};

/* ----------------- utility --------------------- */
type ExBase = {
  project: string;
  workspace: string;
  parent: string | null;

  external_id: string;
  external_source: string;

  updated_by: string;
  created_by: string;

  created_at: string;
  update_at: string;
};

export type Optional<T extends object> = {
  [K in keyof T]?: T[K];
};

export type Paginated<T> = {
  grouped_by: null | string;
  sub_grouped_by: null | string;
  total_count: number;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  count: number;
  total_pages: number;
  total_results: number;
  results: T[];
};

export type ExcludedProps = "id" | "created_at" | "updated_at" | "updated_by";

/* ----------------- Base Types --------------------- */
type IIssueLabel = {
  id: string;
  name: string;
  color: string;
  parent: string | null;
  sort_order: number;
};

export type IIssueComment = {
  id: string;
  issue: string;
  actor: string;
  comment_html: string;
  comment_stripped: string;
  access: string;
  is_member: boolean;
};

type IIsssue = {
  id: string;
  updated_at: string;
  point: any;
  name: string;
  description_html: string;
  description_stripped: string;
  description_binary: any;
  priority: string;
  start_date: string;
  target_date: string;
  sequence_id: number;
  sort_order: number;
  completed_at: any;
  archived_at: any;
  is_draft: boolean;
  state: string;
  estimate_point: any;
  assignees: string[];
  labels: string[];
  type_id: string | undefined;
};

export type ExpandableFields = {
  state: ExState;
  project: ExProject;
  assignees: ExUser[];
  labels: ExIssueLabel[];
  type: ExIssueType;
}
// Create a type that can handle both expanded and unexpanded fields
export type IssueWithExpanded<T extends Array<keyof ExpandableFields>> = Omit<ExIssue, T[number]> &
  Pick<ExpandableFields, T[number]>;


export type TStateGroups = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export interface IState {
  id: string;
  color: string;
  default: boolean;
  description: string;
  group: TStateGroups;
  name: string;
  sequence: number;
}

export type TModuleStatus = "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled";

export interface IModule {
  total_issues: number;
  completed_issues: number;
  backlog_issues: number;
  started_issues: number;
  unstarted_issues: number;
  cancelled_issues: number;
  total_estimate_points?: number;
  completed_estimate_points?: number;
  backlog_estimate_points: number;
  started_estimate_points: number;
  unstarted_estimate_points: number;
  cancelled_estimate_points: number;

  id: string;
  name: string;
  description: string;
  description_text: any;
  description_html: any;
  lead: string | null;
  members: string[];
  // link_module?: ILinkDetails[];
  sub_issues?: number;
  is_favorite: boolean;
  sort_order: number;
  // view_props: {
  // 	filters: IIssueFilterOptions;
  // };
  status?: TModuleStatus;
  archived_at: string | null;
  start_date: string | null;
  target_date: string | null;
}

export interface ICycle {
  id: string;
  total_issues: number;
  cancelled_issues: number;
  completed_issues: number;
  started_issues: number;
  unstarted_issues: number;
  backlog_issues: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  view_props: Record<string, any>;
  sort_order: number;
  progress_snapshot: Record<string, any>;
  archived_at: string | null;
  logo_props: Record<string, any>;
  owned_by: string;
}

export type ExIssueAttachment = {
  id: string;
  attributes: {
    name: string;
    size: number;
  };
  asset: string;
  issue_id: string;
  is_uploaded: boolean;

  //need
  updated_at: string;
  updated_by: string;

  external_id: string;
  external_source: string;
};

export type ExIntakeIssue<T = ExIssue> = {
  id: string;
  issue_detail: T;
  inbox: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: number;
  snoozed_till: string | null;
  source: string;
  source_email: string | null;
  external_source: string | null;
  external_id: string | null;
  created_by: string;
  updated_by: string | null;
  project: string;
  workspace: string;
  intake: string;
  issue: string;
  duplicate_to: string | null;
  extra: Record<string, any>;
}

/* ----------------- Project Type --------------------- */
type IProject = {
  id: string;
  total_members: number;
  total_cycles: number;
  total_modules: number;
  is_member: boolean;
  sort_order: number;
  member_role: number;
  is_deployed: boolean;
  name: string;
  description: string;
  description_text: any;
  description_html: any;
  network: number;
  identifier: string;
  emoji: any;
  icon_prop: any;
  module_view: boolean;
  cycle_view: boolean;
  issue_views_view: boolean;
  page_view: boolean;
  inbox_view: boolean;
  intake_view: boolean;
  is_time_tracking_enabled: boolean;
  is_issue_type_enabled: boolean;
  cover_image: string;
  archive_in: number;
  close_in: number;
  logo_props: {
    in_use: "emoji" | "icon";
    emoji?: {
      value?: string;
      url?: string;
    };
    icon?: {
      name?: string;
      color?: string;
      background_color?: string;
    };
  };
  archived_at: string | null;
  start_date: string | null;
  target_date: string | null;
  default_assignee: any;
  project_lead: any;
  estimate: any;
  default_state: any;
};

export type ExProject = Partial<IProject> & Partial<ExBase>;

/* ----------------- Export Types --------------------- */
export type ExIssueLabel = IIssueLabel & ExBase;
export type ExState = IState &
  ExBase & {
    status: "to_be_created";
  };

export type ExIssueLink = {
  title: string;
  url: string;
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string;
  updated_by: string | null;
  project: string;
  workspace: string;
  issue: string;
  metadata: Record<string, any>;
};

export type ExIssue = IIsssue &
  ExBase & {
    links?: {
      name: string;
      url: string;
    }[];
    attachments?: ExIssueAttachment[];
    external_source_state_id?: string;
  };
export type ExIssueComment = IIssueComment & ExBase;
export type ExModule = IModule &
  ExBase & {
    issues: string[];
  };
export type ExCycle = ICycle &
  ExBase & {
    issues: string[];
  };

export type ExPage = ExBase & {
  id: string;
  name: string;
  access: number;
  owned_by: string;
  parent_id: string | null;
  description_html: string;
  description_stripped: string;
  external_id: string;
  external_source: string;
};

type ExUser = {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  role: number;
};

type UserMandatePayload = {
  email: string;
  display_name: string;
};

export type PlaneUser = ExUser & UserMandatePayload;

export type UserCreatePayload = Optional<ExUser> &
  UserMandatePayload & {
    project_id: string;
  };

export type UserResponsePayload = ExUser & UserMandatePayload;

export interface Attributes {
  name: string;
  type: string;
  size: number;
}

export interface StorageMetadata {
  // Empty object in this case, but we'll define it for completeness
  [key: string]: any;
}

export enum EInboxIssueStatus {
  PENDING = -2,
  DECLINED = -1,
  SNOOZED = 0,
  ACCEPTED = 1,
  DUPLICATE = 2,
}

export type TInboxIssueStatus = EInboxIssueStatus;

export type TPaginationInfo = {
  count: number;
  extra_stats: string | null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  total_pages: number;
  per_page?: number;
  total_results: number;
};

export type TInboxIssue = {
  id: string;
  status: TInboxIssueStatus;
  snoozed_till: Date | null;
  duplicate_to: string | undefined;
  source: string | undefined;
  issue: ExIssue;
  created_by: string;
  duplicate_issue_detail: any | undefined;
}

export type TInboxIssuePaginationInfo = TPaginationInfo & {
  total_results: number;
};

export type TInboxIssueWithPagination = TInboxIssuePaginationInfo & {
  results: TInboxIssue[];
};


export interface Attachment {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
  attributes: Attributes;
  asset: string;
  entity_type: string;
  is_deleted: boolean;
  is_archived: boolean;
  external_id: null | string;
  external_source: null | string;
  size: number;
  is_uploaded: boolean;
  storage_metadata: StorageMetadata;
  created_by: string;
  updated_by: string;
  user: null | string;
  workspace: string;
  draft_issue: null | string;
  project: string;
  issue: string;
  comment: null | string;
  page: null | string;
}

export interface UploadData {
  url: string;
  fields: {
    "Content-Type": string;
    key: string;
    "x-amz-algorithm": string;
    "x-amz-credential": string;
    "x-amz-date": string;
    policy: string;
    "x-amz-signature": string;
  };
}

export interface AttachmentResponse {
  already_exists: boolean;
  asset_id: string;
  upload_data: UploadData;
  attachment: Attachment;
  asset_url: string;
}

export interface IssueSearchResponse {
  name: string;
  id: string;
  sequence_id: number;
  project__identifier: string;
  project_id: string;
  workspace__slug: string;
  type_id: string | null;
}

export interface ExAsset {
  id: string;
  attributes: {
    name: string;
    type: string;
    size: number;
  };
  asset: string;
  asset_url: string;
  workspace_id: string;
  created_by: string;
  external_id?: string;
  external_source?: string;
  entity_type: string;
  is_uploaded: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetUploadResponse {
  already_exists: boolean;
  upload_data: UploadData;
  asset_id: string;
  asset_url: string;
}
