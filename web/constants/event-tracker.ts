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

export const getProjectStateEventPayload = (payload: any) => {
  return {
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
  };
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
// Module Events
export const MODULE_CREATED = "Module created";
export const MODULE_UPDATED = "Module updated";
export const MODULE_DELETED = "Module deleted";
// Issue Events
export const ISSUE_CREATED = "Issue created";
export const ISSUE_UPDATED = "Issue updated";
export const ISSUE_DELETED = "Issue deleted";
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
// Product Tour Events
export const PRODUCT_TOUR_STARTED = "Product tour started";
export const PRODUCT_TOUR_COMPLETED = "Product tour completed";
export const PRODUCT_TOUR_SKIPPED = "Product tour skipped";
// Groups
export const GROUP_WORKSPACE = "Workspace_metrics";
