import type { IUserLite, IWorkspace } from "./";

export interface IProject {
  id: string;
  workspace: IWorkspace | string;
  default_assignee: IUser | string | null;
  project_lead: IUser | string | null;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string;
  network: number;
  identifier: string;
  slug: string;
  created_by: string;
  updated_by: string;
  icon: string;
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
