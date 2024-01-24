import { EUserProjectRoles } from "constants/project";
import { IIssueActivity, IIssueLite, TStateGroups } from ".";

export interface IUser {
  id: string;
  avatar: string;
  cover_image: string | null;
  date_joined: string;
  display_name: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_bot: boolean;
  is_email_verified: boolean;
  is_managed: boolean;
  is_onboarded: boolean;
  is_password_autoset: boolean;
  is_tour_completed: boolean;
  is_password_autoset: boolean;
  mobile_number: string | null;
  role: string | null;
  onboarding_step: {
    workspace_join?: boolean;
    profile_complete?: boolean;
    workspace_create?: boolean;
    workspace_invite?: boolean;
  };
  last_workspace_id: string;
  user_timezone: string;
  username: string;
  theme: IUserTheme;
  use_case?: string;
}

export interface IInstanceAdminStatus {
  is_instance_admin: boolean;
}

export interface IUserSettings {
  id: string;
  email: string;
  workspace: {
    last_workspace_id: string;
    last_workspace_slug: string;
    fallback_workspace_id: string;
    fallback_workspace_slug: string;
    invites: number;
  };
}

export interface IUserTheme {
  background: string;
  text: string;
  primary: string;
  sidebarBackground: string;
  sidebarText: string;
  darkPalette: boolean;
  palette: string;
  theme: string;
}

export interface IUserLite {
  avatar: string;
  display_name: string;
  email?: string;
  first_name: string;
  id: string;
  is_bot: boolean;
  last_name: string;
}

export interface IUserMemberLite extends IUserLite {
  email?: string;
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

export interface IUserActivityResponse {
  count: number;
  extra_stats: null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  results: IIssueActivity[];
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
    display_name: string;
    first_name: string;
    last_name: string;
    user_timezone: string;
  };
}

export interface IUserProjectsRole {
  [projectId: string]: EUserProjectRoles;
}

export interface IUserEmailNotificationSettings {
  property_change: boolean;
  state_change: boolean;
  comment: boolean;
  mention: boolean;
  issue_completed: boolean;
}

// export interface ICurrentUser {
//   id: readonly string;
//   avatar: string;
//   first_name: string;
//   last_name: string;
//   username: string;
//   email: string;
//   mobile_number: string;
//   is_email_verified: boolean;
//   is_tour_completed: boolean;
//   onboarding_step: TOnboardingSteps;
//   is_onboarded: boolean;
//   role: string;
// }

// export interface ICustomTheme {
//   background: string;
//   text: string;
//   primary: string;
//   sidebarBackground: string;
//   sidebarText: string;
//   darkPalette: boolean;
//   palette: string;
//   theme: string;
// }

// export interface ICurrentUserSettings {
//   theme: ICustomTheme;
// }
