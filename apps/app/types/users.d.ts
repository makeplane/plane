import {
  IIssue,
  IIssueLite,
  IWorkspace,
  IWorkspaceLite,
  NestedKeyOf,
  Properties,
  TStateGroups,
} from "./";

export interface IUser {
  avatar: string;
  created_at: readonly Date;
  created_location: readonly string;
  date_joined: readonly Date;
  email: string;
  first_name: string;
  id: readonly string;
  is_email_verified: boolean;
  is_onboarded: boolean;
  is_tour_completed: boolean;
  last_location: readonly string;
  last_login: readonly Date;
  last_name: string;
  mobile_number: string;
  my_issues_prop: {
    properties: Properties;
    groupBy: NestedKeyOf<IIssue> | null;
  } | null;
  onboarding_step: TOnboardingSteps;
  role: string;
  token: string;
  theme: ICustomTheme;
  updated_at: readonly Date;
  username: string;

  [...rest: string]: any;
}

export interface ICustomTheme {
  background: string;
  text: string;
  primary: string;
  sidebarBackground: string;
  sidebarText: string;
  darkPalette: boolean;
  palette: string;
}

export interface ICurrentUserResponse extends IUser {
  assigned_issues: number;
  last_workspace_id: string | null;
  workspace_invites: number;
  workspace: {
    fallback_workspace_id: string | null;
    fallback_workspace_slug: string | null;
    invites: number;
    last_workspace_id: string | null;
    last_workspace_slug: string | null;
  };
}
export interface IUserLite {
  avatar: string;
  created_at: Date;
  email: string;
  first_name: string;
  readonly id: string;
  is_bot: boolean;
  last_name: string;
}

export interface IUserActivity {
  created_date: string;
  activity_count: number;
}

export interface IUserPriorityDistribution {
  priority: string;
  priority_count: number;
}

export interface IUserStateDistribution {
  state_group: TStateGroups;
  state_count: number;
}

export interface IUserWorkspaceDashboard {
  assigned_issues_count: number;
  completed_issues_count: number;
  issue_activities: IUserActivity[];
  issues_due_week_count: number;
  overdue_issues: IIssueLite[];
  completed_issues: {
    week_in_month: number;
    completed_count: number;
  }[];
  pending_issues_count: number;
  state_distribution: IUserStateDistribution[];
  upcoming_issues: IIssueLite[];
}

export interface IUserDetailedActivity {
  actor: string;
  actor_detail: IUserLite;
  attachments: any[];
  comment: string;
  created_at: string;
  created_by: string | null;
  field: string;
  id: string;
  issue: string;
  issue_comment: string | null;
  new_identifier: string | null;
  new_value: string | null;
  old_identifier: string | null;
  old_value: string | null;
  project: string;
  updated_at: string;
  updated_by: string | null;
  verb: string;
  workspace: string;
  workspace_detail: IWorkspaceLite;
}

export interface IUserActivityResponse {
  count: number;
  extra_stats: null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  results: IUserDetailedActivity[];
  total_pages: number;
}

export type UserAuth = {
  isMember: boolean;
  isOwner: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

export type TOnboardingSteps = {
  profile_complete: boolean;
  workspace_create: boolean;
  workspace_invite: boolean;
  workspace_join: boolean;
};

export interface IUserProfileData {
  assigned_issues: number;
  completed_issues: number;
  created_issues: number;
  pending_issues: number;
  priority_distribution: IUserPriorityDistribution[];
  state_distribution: IUserStateDistribution[];
  subscribed_issues: number;
}

export interface IUserProfileProjectSegregation {
  project_data: {
    assigned_issues: number;
    completed_issues: number;
    created_issues: number;
    emoji: string | null;
    icon_prop: null;
    id: string;
    identifier: string;
    name: string;
    pending_issues: number;
  }[];
  user_data: {
    avatar: string;
    cover_image: string | null;
    date_joined: Date;
    email: string;
    first_name: string;
    last_name: string;
    user_timezone: string;
  };
}
