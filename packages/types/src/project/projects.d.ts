import type {
  IProjectViewProps,
  IUser,
  IUserLite,
  IUserMemberLite,
  IWorkspace,
  IWorkspaceLite,
  TLogoProps,
  TStateGroups,
} from "..";
import { TUserPermissions } from "../enums";

export interface IProject {
  archive_in: number;
  archived_at: string | null;
  archived_issues: number;
  archived_sub_issues: number;
  close_in: number;
  created_at: Date;
  created_by: string;
  cover_image: string | null;
  cycle_view: boolean;
  issue_views_view: boolean;
  module_view: boolean;
  page_view: boolean;
  inbox_view: boolean;
  default_assignee: IUser | string | null;
  default_state: string | null;
  description: string;
  draft_issues: number;
  draft_sub_issues: number;
  estimate: string | null;
  guest_view_all_features: boolean;
  id: string;
  identifier: string;
  anchor: string | null;
  is_favorite: boolean;
  is_issue_type_enabled: boolean;
  is_member: boolean;
  is_time_tracking_enabled: boolean;
  logo_props: TLogoProps;
  member_role: TUserPermissions | null;
  members: IProjectMemberLite[];
  name: string;
  network: number;
  project_lead: IUserLite | string | null;
  sort_order: number | null;
  sub_issues: number;
  total_cycles: number;
  total_issues: number;
  total_members: number;
  total_modules: number;
  updated_at: Date;
  updated_by: string;
  workspace: IWorkspace | string;
  workspace_detail: IWorkspaceLite;
}

export interface IProjectLite {
  id: string;
  name: string;
  identifier: string;
  logo_props: TLogoProps;
}

type ProjectPreferences = {
  pages: {
    block_display: boolean;
  };
};

export interface IProjectMap {
  [id: string]: IProject;
}

export interface IProjectMemberLite {
  id: string;
  member__avatar: string;
  member__display_name: string;
  member_id: string;
}

export interface IProjectMember {
  id: string;
  member: IUserMemberLite;
  project: IProjectLite;
  workspace: IWorkspaceLite;
  comment: string;
  role: TUserPermissions;

  preferences: ProjectPreferences;

  view_props: IProjectViewProps;
  default_props: IProjectViewProps;

  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

export interface IProjectMembership {
  id: string;
  member: string;
  role: TUserPermissions;
}

export interface IProjectBulkAddFormData {
  members: { role: TUserPermissions; member_id: string }[];
}

export interface IGithubRepository {
  id: string;
  full_name: string;
  html_url: string;
  url: string;
}

export interface GithubRepositoriesResponse {
  repositories: IGithubRepository[];
  total_count: number;
}

export type TProjectIssuesSearchParams = {
  search: string;
  parent?: boolean;
  issue_relation?: boolean;
  cycle?: boolean;
  module?: string;
  sub_issue?: boolean;
  issue_id?: string;
  workspace_search: boolean;
  target_date?: string;
};

export interface ISearchIssueResponse {
  id: string;
  name: string;
  project_id: string;
  project__identifier: string;
  project__name: string;
  sequence_id: number;
  start_date: string | null;
  state__color: string;
  state__group: TStateGroups;
  state__name: string;
  workspace__slug: string;
  type_id: string;
}
