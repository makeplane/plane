import type { IUserLite, IWorkspace } from "./";

export interface IProject {
  created_at: Date;
  created_by: string;
  cycle_view: boolean;
  default_assignee: IUser | string | null;
  description: string;
  icon: string;
  id: string;
  identifier: string;
  module_view: boolean;
  name: string;
  network: number;
  project_lead: IUser | string | null;
  slug: string;
  updated_at: Date;
  updated_by: string;
  workspace: IWorkspace | string;
}

type ProjectViewTheme = {
  collapsed: boolean;
  issueView: "list" | "kanban" | null;
  groupByProperty: NestedKeyOf<IIssue> | null;
  filterIssue: "activeIssue" | "backlogIssue" | null;
  orderBy: NestedKeyOf<IIssue> | null;
};

export interface IProjectMember {
  member: IUserLite;
  project: IProject;
  workspace: IWorkspace;
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
