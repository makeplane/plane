import type { IUser } from "./";

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

export interface WorkspaceMember {
  readonly id: string;
  email: string;
  message: string;
  role: 5 | 10 | 15 | 20;
  member: IUser;
  workspace: IWorkspace | string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

export interface ProjectMember {
  readonly id: string;
  readonly project: string;
  email: string;
  message: string;
  role: 5 | 10 | 15 | 20;
  member: string;
  member_id: string;
  user_id: string;
}
