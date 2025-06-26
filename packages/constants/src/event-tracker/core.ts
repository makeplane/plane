export type IssueEventProps = {
  eventName: string;
  payload: any;
  updates?: any;
  path?: string;
};

export type EventProps = {
  eventName: string;
  payload: any;
  updates?: any;
  path?: string;
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

  if (eventName === WORK_ITEM_EVENT_TRACKER_KEYS.update) {
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

// Dashboard Events
export const GITHUB_REDIRECTED = "GitHub redirected";
// Groups
export const GROUP_WORKSPACE = "Workspace_metrics";

export const WORKSPACE_EVENT_TRACKER_KEYS = {
  create: "Workspace created",
  update: "Workspace updated",
  delete: "Workspace deleted",
};

export const PROJECT_EVENT_TRACKER_KEYS = {
  create: "Project created",
  update: "Project updated",
  delete: "Project deleted",
};

export const CYCLE_EVENT_TRACKER_KEYS = {
  create: "Cycle created",
  update: "Cycle updated",
  delete: "Cycle deleted",
  favorite: "Cycle favorited",
  unfavorite: "Cycle unfavorited",
};

export const MODULE_EVENT_TRACKER_KEYS = {
  create: "Module created",
  update: "Module updated",
  delete: "Module deleted",
  favorite: "Module favorited",
  unfavorite: "Module unfavorited",
  link: {
    create: "Module link created",
    update: "Module link updated",
    delete: "Module link deleted",
  },
};

export const WORK_ITEM_EVENT_TRACKER_KEYS = {
  create: "Work item created",
  update: "Work item updated",
  delete: "Work item deleted",
  archive: "Work item archived",
  restore: "Work item restored",
};

export const STATE_EVENT_TRACKER_KEYS = {
  create: "State created",
  update: "State updated",
  delete: "State deleted",
};

export const PAGE_EVENT_TRACKER_KEYS = {
  create: "Page created",
  update: "Page updated",
  delete: "Page deleted",
};

export const MEMBER_EVENT_TRACKER_KEYS = {
  invite: "Member invited",
  accept: "Member accepted",
  project: {
    add: "Project member added",
    leave: "Project member left",
  },
  workspace: {
    leave: "Workspace member left",
  },
};

export const AUTH_EVENT_TRACKER_KEYS = {
  navigate: {
    sign_up: "Navigate to sign-up page",
    sign_in: "Navigate to sign-in page",
  },
  code_verify: "Code verified",
  sign_up_with_password: "Sign up with password",
  sign_in_with_password: "Sign in with password",
  sign_in_with_code: "Sign in with magic link",
  forgot_password: "Forgot password clicked",
};

export const PRODUCT_TOUR_EVENT_TRACKER_KEYS = {
  start: "Product tour started",
  complete: "Product tour completed",
  skip: "Product tour skipped",
};

export const GLOBAL_VIEW_TOUR_EVENT_TRACKER_KEYS = {
  create: "Global view created",
  update: "Global view updated",
  delete: "Global view deleted",
  open: "Global view opened",
};

export const NOTIFICATION_EVENT_TRACKER_KEYS = {
  archive: "Notification archived",
  all_marked_read: "All notifications marked read",
};

export const USER_EVENT_TRACKER_KEYS = {
  add_details: "User details added",
  onboarding_complete: "User onboarding completed",
};

export const ONBOARDING_EVENT_TRACKER_KEYS = {
  root: "Onboarding",
  step_1: "Onboarding step 1",
  step_2: "Onboarding step 2",
};

export const SIDEBAR_EVENT_TRACKER_KEYS = {
  click: "Sidenav clicked",
};
