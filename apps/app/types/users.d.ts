import { IIssue, IIssueLite, IWorkspace, NestedKeyOf, Properties } from "./";

export interface IUser {
  id: readonly string;
  last_login: readonly Date;
  avatar: string;
  username: string;
  mobile_number: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: readonly Date;
  created_at: readonly Date;
  updated_at: readonly Date;
  last_location: readonly string;
  created_location: readonly string;
  is_email_verified: boolean;
  token: string;
  role: string;

  my_issues_prop?: {
    properties: Properties;
    groupBy: NestedKeyOf<IIssue> | null;
  };

  [...rest: string]: any;
}

export interface IUserLite {
  readonly id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string;
  created_at: Date;
  is_bot: boolean;
}

export interface IUserActivity {
  created_date: string;
  activity_count: number;
}

export interface IUserStateDistribution {
  state_group: string;
  state_count: number;
}

export interface IUserWorkspaceDashboard {
  assigned_issues_count: number;
  completed_issues_count: number;
  issue_activities: IUserActivity[];
  issues_due_week_count: number;
  overdue_issues: IIssueLite[];
  pending_issues_count: number;
  state_distribution: IUserStateDistribution[];
  upcoming_issues: IIssueLite[];
}

export type UserAuth = {
  isMember: boolean;
  isOwner: boolean;
  isViewer: boolean;
  isGuest: boolean;
};
