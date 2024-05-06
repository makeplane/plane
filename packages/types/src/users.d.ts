import {
  EUserProjectRoles,
  IIssueActivity,
  TIssuePriorities,
  TStateGroups,
} from ".";

type TLoginMediums = "email" | "magic-code" | "github" | "google";

export interface IUser {
  id: string;
  avatar: string | null;
  cover_image: string | null;
  date_joined: string;
  display_name: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_bot: boolean;
  is_email_verified: boolean;
  is_password_autoset: boolean;
  is_tour_completed: boolean;
  mobile_number: string | null;
  role: string | null;
  last_workspace_id: string;
  user_timezone: string;
  username: string;
  last_login_medium: TLoginMediums;
  theme: IUserTheme;
}

export interface IUserAccount {
  provider_account_id: string;
  provider: string;
  created_at: Date;
  updated_at: Date;
}

export type TUserProfile = {
  id: string | undefined;
  user: string | undefined;
  role: string | undefined;
  last_workspace_id: string | undefined;
  theme: {
    text: string | undefined;
    theme: string | undefined;
    palette: string | undefined;
    primary: string | undefined;
    background: string | undefined;
    darkPalette: boolean | undefined;
    sidebarText: string | undefined;
    sidebarBackground: string | undefined;
  };
  onboarding_step: TOnboardingSteps;
  is_onboarded: boolean;
  is_tour_completed: boolean;
  use_case: string | undefined;
  billing_address_country: string | undefined;
  billing_address: string | undefined;
  has_billing_address: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

export interface IInstanceAdminStatus {
  is_instance_admin: boolean;
}

export interface IUserSettings {
  id: string | undefined;
  email: string | undefined;
  workspace: {
    last_workspace_id: string | undefined;
    last_workspace_slug: string | undefined;
    fallback_workspace_id: string | undefined;
    fallback_workspace_slug: string | undefined;
    invites: number | undefined;
  };
}

export interface IUserTheme {
  text: string | undefined;
  theme: string | undefined;
  palette: string | undefined;
  primary: string | undefined;
  background: string | undefined;
  darkPalette: boolean | undefined;
  sidebarText: string | undefined;
  sidebarBackground: string | undefined;
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
  priority: TIssuePriorities;
  priority_count: number;
}

export interface IUserStateDistribution {
  state_group: TStateGroups;
  state_count: number;
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
    id: string;
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
