import { EUserProjectRoles } from "constants/project";
import type { IUser, IUserLite, IWorkspace, IWorkspaceLite, TStateGroups } from ".";

export interface IProject {
  archive_in: number;
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
  emoji: string | null;
  emoji_and_icon:
    | string
    | {
        name: string;
        color: string;
      }
    | null;
  estimate: string | null;
  icon_prop: {
    name: string;
    color: string;
  } | null;
  id: string;
  identifier: string;
  is_deployed: boolean;
  is_favorite: boolean;
  is_member: boolean;
  member_role: EUserProjectRoles | null;
  members: IProjectMemberLite[];
  name: string;
  network: number;
  project_lead: IUserLite | string | null;
  sort_order: number | null;
  total_cycles: number;
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
  role: EUserProjectRoles;

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
  role: EUserProjectRoles;
}

export interface IProjectBulkAddFormData {
  members: { role: EUserProjectRoles; member_id: string }[];
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
  module?: string[];
  sub_issue?: boolean;
  issue_id?: string;
  workspace_search: boolean;
};

export interface ISearchIssueResponse {
  id: string;
  name: string;
  project_id: string;
  project__identifier: string;
  project__name: string;
  sequence_id: number;
  state__color: string;
  state__group: TStateGroups;
  state__name: string;
  workspace__slug: string;
}
