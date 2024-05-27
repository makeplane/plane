import { IIssueFilters } from "@plane/types";

export type IssueEventProps = {
  eventName: string;
  payload: any;
  updates?: any;
  routePath?: string;
};

export type IssuesListOpenedEventProps = {
  element: string;
  elementId: string;
  filters: IIssueFilters | undefined;
};

export type EventProps = {
  eventName: string;
  payload: any;
};

// Workspace crud Events
export const WORKSPACE_CREATED = "Workspace created";
export const WORKSPACE_UPDATED = "Workspace updated";
export const WORKSPACE_DELETED = "Workspace deleted";
// Project Events
export const PROJECT_CREATED = "Project created";
export const PROJECT_UPDATED = "Project updated";
export const PROJECT_DELETED = "Project deleted";
// Cycle Events
export const CYCLE_CREATED = "Cycle created";
export const CYCLE_UPDATED = "Cycle updated";
export const CYCLE_DELETED = "Cycle deleted";
export const CYCLE_FAVORITED = "Cycle favorited";
export const CYCLE_UNFAVORITED = "Cycle unfavorited";
// Module Events
export const MODULE_CREATED = "Module created";
export const MODULE_UPDATED = "Module updated";
export const MODULE_DELETED = "Module deleted";
export const MODULE_FAVORITED = "Module favorited";
export const MODULE_UNFAVORITED = "Module unfavorited";
export const MODULE_LINK_CREATED = "Module link created";
export const MODULE_LINK_UPDATED = "Module link updated";
export const MODULE_LINK_DELETED = "Module link deleted";
// Issue Events
export const ISSUE_CREATED = "Issue created";
export const ISSUE_UPDATED = "Issue updated";
export const ISSUE_DELETED = "Issue deleted";
export const ISSUE_ARCHIVED = "Issue archived";
export const ISSUE_RESTORED = "Issue restored";
// Issue Checkout Events
export const ISSUES_LIST_OPENED = "Issues list opened";
export const ISSUE_OPENED = "Issue opened";
// Layout & Filter Events
export const LAYOUT_CHANGED = "Layout changed";
// Project State Events
export const STATE_CREATED = "State created";
export const STATE_UPDATED = "State updated";
export const STATE_DELETED = "State deleted";
// Project Page Events
export const PAGE_CREATED = "Page created";
export const PAGE_UPDATED = "Page updated";
export const PAGE_DELETED = "Page deleted";
// Member Events
export const MEMBER_INVITED = "Member invited";
export const MEMBER_ACCEPTED = "Member accepted";
export const PROJECT_MEMBER_ADDED = "Project member added";
export const PROJECT_MEMBER_LEAVE = "Project member leave";
export const WORKSPACE_MEMBER_lEAVE = "Workspace member leave";
// Sign-in & Sign-up Events
export const NAVIGATE_TO_SIGNUP = "Navigate to sign-up page";
export const NAVIGATE_TO_SIGNIN = "Navigate to sign-in page";
export const CODE_VERIFIED = "Code verified";
export const SETUP_PASSWORD = "Password setup";
export const PASSWORD_CREATE_SELECTED = "Password created";
export const PASSWORD_CREATE_SKIPPED = "Skipped to setup";
export const SIGN_IN_WITH_PASSWORD = "Sign in with password";
export const FORGOT_PASSWORD = "Forgot password clicked";
export const FORGOT_PASS_LINK = "Forgot password link generated";
export const NEW_PASS_CREATED = "New password created";
// Onboarding Events
export const USER_DETAILS = "User details added";
export const USER_ONBOARDING_COMPLETED = "User onboarding completed";
// Product Tour Events
export const PRODUCT_TOUR_STARTED = "Product tour started";
export const PRODUCT_TOUR_COMPLETED = "Product tour completed";
export const PRODUCT_TOUR_SKIPPED = "Product tour skipped";
// Dashboard Events
export const CHANGELOG_REDIRECTED = "Changelog redirected";
export const GITHUB_REDIRECTED = "Github redirected";
// Sidebar Events
export const SIDEBAR_CLICKED = "Sidenav clicked";
// Global View Events
export const GLOBAL_VIEW_CREATED = "Global view created";
export const GLOBAL_VIEW_UPDATED = "Global view updated";
export const GLOBAL_VIEW_DELETED = "Global view deleted";
export const GLOBAL_VIEW_OPENED = "Global view opened";
// Notification Events
export const NOTIFICATION_ARCHIVED = "Notification archived";
export const NOTIFICATION_SNOOZED = "Notification snoozed";
export const NOTIFICATION_READ = "Notification marked read";
export const UNREAD_NOTIFICATIONS = "Unread notifications viewed";
export const NOTIFICATIONS_READ = "All notifications marked read";
export const SNOOZED_NOTIFICATIONS = "Snoozed notifications viewed";
export const ARCHIVED_NOTIFICATIONS = "Archived notifications viewed";
// Groups
export const GROUP_WORKSPACE = "Workspace_metrics";
// Elements
export const E_PROJECT = "Project";
export const E_CYCLE = "Cycle";
export const E_ACYCLE = "Active cycle";
export const E_MODULE = "Module";
export const E_PROJECT_VIEW = "Project view";
export const E_WORKSPACE_VIEW = "Workspace view";
export const E_DRAFT = "Draft";
export const E_ARCHIVE = "Archives";
export const E_INBOX = "Inbox";
export const E_NOTIFICATION = "Notification";
export const E_DASHBOARD= "Dashboard";
export const E_PROFILE = "Profile";
