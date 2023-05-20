import type { IProjectMember, IUser, IUserLite } from "types";

export interface IWorkspace {
  readonly id: string;
  readonly owner: IUser;
  readonly created_at: Date;
  readonly updated_at: Date;
  name: string;
  url: string;
  logo: string | null;
  slug: string;
  readonly total_members: number;
  readonly slug: string;
  readonly created_by: string;
  readonly updated_by: string;
  company_size: number | null;
}

export interface IWorkspaceLite {
  readonly id: string;
  name: string;
  slug: string;
}

export interface IWorkspaceMemberInvitation {
  accepted: boolean;
  readonly id: string;
  email: string;
  token: string;
  message: string;
  responded_at: Date;
  role: 5 | 10 | 15 | 20;
  workspace: IWorkspace;
}

export interface IWorkspaceMember {
  readonly id: string;
  user: IUserLite;
  workspace: IWorkspace;
  member: IUserLite;
  role: 5 | 10 | 15 | 20;
  company_role: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

export interface ILastActiveWorkspaceDetails {
  workspace_details: IWorkspace;
  project_details?: IProjectMember[];
}

export interface IWorkspaceDefaultSearchResult {
  name: string;
  id: string;
  project_id: string;
  workspace__slug: string;
}
export interface IWorkspaceSearchResult {
  name: string;
  id: string;
  slug: string;
}

export interface IWorkspaceIssueSearchResult {
  name: string;
  id: string;
  sequence_id: number;
  project__identifier: string;
  project_id: string;
  workspace__slug: string;
}
export interface IWorkspaceSearchResults {
  results: {
    workspace: IWorkspaceSearchResult[];
    project: IWorkspaceDefaultSearchResult[];
    issue: IWorkspaceIssueSearchResult[];
    cycle: IWorkspaceDefaultSearchResult[];
    module: IWorkspaceDefaultSearchResult[];
    issue_view: IWorkspaceDefaultSearchResult[];
    page: IWorkspaceDefaultSearchResult[];
  };
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
