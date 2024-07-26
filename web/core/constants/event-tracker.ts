export type IssueEventProps = {
  eventName: string;
  payload: any;
  updates?: any;
  path?: string;
};

export type EventProps = {
  eventName: string;
  payload: any;
};

export const getWorkspaceEventPayload = (payload: any) => ({
  workspace_id: payload.id,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  organization_size: payload.organization_size,
  first_time: payload.first_time,
  state: payload.state,
  element: payload.element,
});

export const getProjectEventPayload = (payload: any) => ({
  workspace_id: payload.workspace_id,
  project_id: payload.id,
  identifier: payload.identifier,
  project_visibility: payload.network == 2 ? "Public" : "Private",
  changed_properties: payload.changed_properties,
  lead_id: payload.project_lead,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  state: payload.state,
  element: payload.element,
});

export const getCycleEventPayload = (payload: any) => ({
  workspace_id: payload.workspace_id,
  project_id: payload.project,
  cycle_id: payload.id,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  start_date: payload.start_date,
  target_date: payload.target_date,
  cycle_status: payload.status,
  changed_properties: payload.changed_properties,
  state: payload.state,
  element: payload.element,
});

export const getModuleEventPayload = (payload: any) => ({
  workspace_id: payload.workspace_id,
  project_id: payload.project,
  module_id: payload.id,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  start_date: payload.start_date,
  target_date: payload.target_date,
  module_status: payload.status,
  lead_id: payload.lead,
  changed_properties: payload.changed_properties,
  member_ids: payload.members,
  state: payload.state,
  element: payload.element,
});

export const getPageEventPayload = (payload: any) => ({
  workspace_id: payload.workspace_id,
  project_id: payload.project,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  access: payload.access === 0 ? "Public" : "Private",
  is_locked: payload.is_locked,
  archived_at: payload.archived_at,
  created_by: payload.created_by,
  state: payload.state,
  element: payload.element,
});

export const getIssueEventPayload = (props: IssueEventProps) => {
  const { eventName, payload, updates, path } = props;
  let eventPayload: any = {
    issue_id: payload.id,
    estimate_point: payload.estimate_point,
    link_count: payload.link_count,
    target_date: payload.target_date,
    is_draft: payload.is_draft,
    label_ids: payload.label_ids,
    assignee_ids: payload.assignee_ids,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
    sequence_id: payload.sequence_id,
    module_ids: payload.module_ids,
    sub_issues_count: payload.sub_issues_count,
    parent_id: payload.parent_id,
    project_id: payload.project_id,
    workspace_id: payload.workspace_id,
    priority: payload.priority,
    state_id: payload.state_id,
    start_date: payload.start_date,
    attachment_count: payload.attachment_count,
    cycle_id: payload.cycle_id,
    module_id: payload.module_id,
    archived_at: payload.archived_at,
    state: payload.state,
    view_id: path?.includes("workspace-views") || path?.includes("views") ? path.split("/").pop() : "",
  };

  if (eventName === ISSUE_UPDATED) {
    eventPayload = {
      ...eventPayload,
      ...updates,
      updated_from: props.path?.includes("workspace-views")
        ? "All views"
        : props.path?.includes("cycles")
          ? "Cycle"
          : props.path?.includes("modules")
            ? "Module"
            : props.path?.includes("views")
              ? "Project view"
              : props.path?.includes("inbox")
                ? "Inbox"
                : props.path?.includes("draft")
                  ? "Draft"
                  : "Project",
    };
  }
  return eventPayload;
};

export const getProjectStateEventPayload = (payload: any) => ({
  workspace_id: payload.workspace_id,
  project_id: payload.id,
  state_id: payload.id,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  group: payload.group,
  color: payload.color,
  default: payload.default,
  state: payload.state,
  element: payload.element,
});

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
export const ISSUE_OPENED = "Issue opened";
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
export const WORKSPACE_MEMBER_LEAVE = "Workspace member leave";
// Sign-in & Sign-up Events
export const NAVIGATE_TO_SIGNUP = "Navigate to sign-up page";
export const NAVIGATE_TO_SIGNIN = "Navigate to sign-in page";
export const CODE_VERIFIED = "Code verified";
export const SETUP_PASSWORD = "Password setup";
export const PASSWORD_CREATE_SELECTED = "Password created";
export const PASSWORD_CREATE_SKIPPED = "Skipped to setup";
export const SIGN_IN_WITH_PASSWORD = "Sign in with password";
export const SIGN_UP_WITH_PASSWORD = "Sign up with password";
export const SIGN_IN_WITH_CODE = "Sign in with magic link";
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

//Elements
export const E_ONBOARDING = "Onboarding";
export const E_ONBOARDING_STEP_1 = "Onboarding step 1";
export const E_ONBOARDING_STEP_2 = "Onboarding step 2";