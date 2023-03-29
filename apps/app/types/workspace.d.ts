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
  readonly id: string;
  email: string;
  accepted: boolean;
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
