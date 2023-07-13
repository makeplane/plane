import type {
  IIssueFilterOptions,
  IUserLite,
  IWorkspace,
  IWorkspaceLite,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TIssueViewOptions,
} from "./";

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
  is_favorite: boolean;
  issue_views_view: boolean;
  module_view: boolean;
  name: string;
  network: number;
  page_view: boolean;
  project_lead: IUser | string | null;
  slug: string;
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

export interface IFavoriteProject {
  created_at: Date;
  created_by: string;
  id: string;
  project: string;
  project_detail: IProject;
  updated_at: Date;
  updated_by: string;
  user: string;
  workspace: string;
}

type ProjectViewTheme = {
  issueView: TIssueViewOptions;
  groupByProperty: TIssueGroupByOptions;
  orderBy: TIssueOrderByOptions;
  calendarDateRange: string;
  filters: IIssueFilterOptions;
};

export interface IProjectMember {
  id: string;
  member: IUserLite;
  project: IProjectLite;
  workspace: IWorkspaceLite;
  comment: string;
  role: 5 | 10 | 15 | 20;

  view_props: ProjectViewTheme;
  default_props: ProjectViewTheme;

  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

export interface IProjectMemberInvitation {
  id: string;

  project: IProject;
  workspace: IWorkspace;

  email: string;
  accepted: boolean;
  token: string;
  message: string;
  responded_at: Date;
  role: 5 | 10 | 15 | 20;

  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

export interface IProjectBulkInviteFormData {
  members: { role: 5 | 10 | 15 | 20; member_id: string }[];
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
  blocker_blocked_by?: boolean;
  cycle?: boolean;
  module?: boolean;
  sub_issue?: boolean;
  issue_id?: string;
};

export interface ISearchIssueResponse {
  id: string;
  name: string;
  project_id: string;
  project__identifier: string;
  sequence_id: number;
  state__color: string;
  state__group: string;
  state__name: string;
  workspace__slug: string;
}
