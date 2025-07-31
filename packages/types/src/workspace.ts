import type { TPaginationInfo } from "./common";
import type { ICycle } from "./cycle";
import { TUserPermissions } from "./enums";
import { EProductSubscriptionEnum } from "./payment";
import { TProjectMembership } from "./project";
import type { IUser, IUserLite } from "./users";
import type { IWorkspaceViewProps } from "./view-props";
// extended imports
import { TWorkspaceExtendedResultEntities } from "./workspace-extended";

export enum EUserWorkspaceRoles {
  ADMIN = 20,
  MEMBER = 15,
  GUEST = 5,
}

export interface IWorkspace {
  readonly id: string;
  readonly owner: IUser;
  readonly created_at: Date;
  readonly updated_at: Date;
  name: string;
  url: string;
  logo_url: string | null;
  readonly total_members: number;
  readonly slug: string;
  readonly created_by: string;
  readonly updated_by: string;
  organization_size: string;
  total_projects?: number;
  current_plan?: EProductSubscriptionEnum;
  is_on_trial?: boolean;
  role: number;
}

export interface IWorkspaceLite {
  readonly id: string;
  name: string;
  slug: string;
}

export interface IWorkspaceMemberInvitation {
  accepted: boolean;
  email: string;
  id: string;
  message: string;
  responded_at: Date;
  role: TUserPermissions;
  token: string;
  invite_link: string;
  workspace: {
    id: string;
    logo_url: string;
    name: string;
    slug: string;
  };
}

export interface IWorkspaceBulkInviteFormData {
  emails: { email: string; role: TUserPermissions }[];
}

export type Properties = {
  assignee: boolean;
  start_date: boolean;
  due_date: boolean;
  labels: boolean;
  key: boolean;
  priority: boolean;
  state: boolean;
  sub_issue_count: boolean;
  link: boolean;
  attachment_count: boolean;
  estimate: boolean;
  created_on: boolean;
  updated_on: boolean;
};

export interface IWorkspaceMember {
  id: string;
  member: IUserLite;
  role: TUserPermissions | EUserWorkspaceRoles;
  created_at?: string;
  avatar_url?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  joining_date?: string;
  display_name?: string;
  last_login_medium?: string;
  is_active?: boolean;
}

export interface IWorkspaceMemberMe {
  company_role: string | null;
  created_at: Date;
  created_by: string;
  default_props: IWorkspaceViewProps;
  id: string;
  member: string;
  role: TUserPermissions | EUserWorkspaceRoles;
  updated_at: Date;
  updated_by: string;
  view_props: IWorkspaceViewProps;
  workspace: string;
  draft_issue_count: number;
  active_cycles_count: number;
}

export interface ILastActiveWorkspaceDetails {
  workspace_details: IWorkspace;
  project_details?: TProjectMembership[];
}

export interface IWorkspaceDefaultSearchResult {
  id: string;
  name: string;
  project_id: string;
  project__identifier: string;
  workspace__slug: string;
}
export interface IWorkspaceSearchResult {
  id: string;
  name: string;
  slug: string;
}

export interface IWorkspaceIssueSearchResult {
  id: string;
  name: string;
  project__identifier: string;
  project_id: string;
  sequence_id: number;
  workspace__slug: string;
  type_id: string;
}

export interface IWorkspacePageSearchResult {
  id: string;
  name: string;
  project_ids: string[];
  project__identifiers: string[];
  workspace__slug: string;
}

export interface IWorkspaceProjectSearchResult {
  id: string;
  identifier: string;
  name: string;
  workspace__slug: string;
}

export interface IWorkspaceSearchResults {
  results: {
    workspace: IWorkspaceSearchResult[];
    project: IWorkspaceProjectSearchResult[];
    issue: IWorkspaceIssueSearchResult[];
    cycle: IWorkspaceDefaultSearchResult[];
    module: IWorkspaceDefaultSearchResult[];
    issue_view: IWorkspaceDefaultSearchResult[];
    page: IWorkspacePageSearchResult[];
  } & TWorkspaceExtendedResultEntities;
}

export interface IProductUpdateResponse {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: {
    login: string;
    id: string;
    node_id: string;
    avatar_url: string;
    gravatar_id: "";
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: false;
  };
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: true;
  created_at: string;
  published_at: string;
  assets: [];
  tarball_url: string;
  zipball_url: string;
  body: string;
  reactions: {
    url: string;
    total_count: number;
    "+1": number;
    "-1": number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface IWorkspaceActiveCyclesResponse {
  count: number;
  extra_stats: null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  results: ICycle[];
  total_pages: number;
}

export interface IWorkspaceProgressResponse {
  completed_issues: number;
  total_issues: number;
  started_issues: number;
  cancelled_issues: number;
  unstarted_issues: number;
}
export interface IWorkspaceAnalyticsResponse {
  completion_chart: any;
}

export type TWorkspacePaginationInfo = TPaginationInfo & {
  results: IWorkspace[];
};

export interface IWorkspaceSidebarNavigationItem {
  key?: string;
  is_pinned: boolean;
  sort_order: number;
}

export interface IWorkspaceSidebarNavigation {
  [key: string]: IWorkspaceSidebarNavigationItem;
}

export enum EOnboardingSteps {
  PROFILE_SETUP = "PROFILE_SETUP",
  ROLE_SETUP = "ROLE_SETUP",
  USE_CASE_SETUP = "USE_CASE_SETUP",
  WORKSPACE_CREATE_OR_JOIN = "WORKSPACE_CREATE_OR_JOIN",
  INVITE_MEMBERS = "INVITE_MEMBERS",
}

export type TOnboardingStep = EOnboardingSteps;

export enum ECreateOrJoinWorkspaceViews {
  WORKSPACE_CREATE = "WORKSPACE_CREATE",
  WORKSPACE_JOIN = "WORKSPACE_JOIN",
}

export type TWorkspaceConnection<TConnectionConfig = object, TConnectionData = object> = {
  id: string;
  workspace_id: string;
  workspace_slug: string;
  credential_id: string;
  target_hostname?: string | null;
  source_hostname?: string | null;
  connection_type: string;
  connection_id: string;
  connection_data: TConnectionData;
  connection_slug?: string | null;
  scopes: string[];
  config: TConnectionConfig;
  created_at?: string;
  updated_at?: string;
};

export type TWorkspaceUserConnection = TWorkspaceConnection & {
  isUserConnected: boolean;
};

export type TWorkspaceEntityConnection<TConnectionConfig = object> = {
  id: string;
  type: string;
  workspace_connection_id: string;
  workspace_id: string;
  workspace_slug: string;
  project_id?: string | null;
  issue_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_slug?: string | null;
  entity_data: object;
  config: TConnectionConfig;
  created_at?: string;
  updated_at?: string;
};

export type TWorkspaceCredential = {
  id: string;
  source: string;
  workspace_id: string;
  user_id: string;
  source_identifier?: string | null;
  source_authorization_type?: string | null;
  source_auth_email?: string | null;
  source_access_token?: string | null;
  source_refresh_token?: string | null;
  source_hostname?: string | null;
  target_identifier?: string | null;
  target_authorization_type?: string | null;
  target_access_token?: string | null;
  target_refresh_token?: string | null;
  target_hostname?: string | null;
  is_pat?: boolean | false;
  is_active?: boolean | false;
  created_at?: string;
  updated_at?: string;
};

// Type for verification of both target credentials
export type TWorkspaceCredentialVerification = {
  isAuthenticated: boolean;
  isOAuthEnabled: boolean;
};

// Type for verification of both source and target credentials
export type TImporterCredentialValidation = TWorkspaceCredentialVerification & {
  sourceTokenInvalid?: boolean;
};

export type TWorkspaceEpicsSearchParams = {
  initiative_id?: string;
};
