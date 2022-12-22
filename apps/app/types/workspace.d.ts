import type { IProjectMember, IUser, IUserLite } from "./";

export interface IWorkspace {
  readonly id: string;
  readonly owner: IUser;
  readonly created_at: Date;
  readonly updated_at: Date;
  name: string;
  logo: null;
  readonly slug: string;
  readonly created_by: string;
  readonly updated_by: string;
  company_size: number;
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
