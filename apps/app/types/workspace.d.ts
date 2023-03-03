import type { IProjectMember, IUser, IUserLite } from "./";

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

export interface IAppIntegrations {
  author: string;
  author: "";
  avatar_url: string | null;
  created_at: string;
  created_by: string | null;
  description: any;
  id: string;
  metadata: any;
  network: number;
  provider: string;
  redirect_url: string;
  title: string;
  updated_at: string;
  updated_by: string | null;
  verified: boolean;
  webhook_secret: string;
  webhook_url: string;
}

export interface IWorkspaceIntegrations {
  actor: string;
  api_token: string;
  config: any;
  created_at: string;
  created_by: string;
  id: string;
  integration: string;
  integration_detail: IIntegrations;
  metadata: any;
  updated_at: string;
  updated_by: string;
  workspace: string;
}
