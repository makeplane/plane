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

  if (eventName === WORK_ITEM_TRACKER_EVENTS.update) {
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
export const GITHUB_REDIRECTED_TRACKER_EVENT = "github_redirected";
// Groups
export const GROUP_WORKSPACE_TRACKER_EVENT = "workspace_metrics";

export const WORKSPACE_TRACKER_EVENTS = {
  create: "workspace_created",
  update: "workspace_updated",
  delete: "workspace_deleted",
};

export const PROJECT_TRACKER_EVENTS = {
  create: "project_created",
  update: "project_updated",
  delete: "project_deleted",
};

export const CYCLE_TRACKER_EVENTS = {
  create: "cycle_created",
  update: "cycle_updated",
  delete: "cycle_deleted",
  favorite: "cycle_favorited",
  unfavorite: "cycle_unfavorited",
};

export const MODULE_TRACKER_EVENTS = {
  create: "module_created",
  update: "module_updated",
  delete: "module_deleted",
  favorite: "module_favorited",
  unfavorite: "module_unfavorited",
  link: {
    create: "module_link_created",
    update: "module_link_updated",
    delete: "module_link_deleted",
  },
};

export const WORK_ITEM_TRACKER_EVENTS = {
  create: "work_item_created",
  update: "work_item_updated",
  delete: "work_item_deleted",
  archive: "work_item_archived",
  restore: "work_item_restored",
};

export const STATE_TRACKER_EVENTS = {
  create: "state_created",
  update: "state_updated",
  delete: "state_deleted",
};

export const PROJECT_PAGE_TRACKER_EVENTS = {
  create: "project_page_created",
  update: "project_page_updated",
  delete: "project_page_deleted",
};

export const MEMBER_TRACKER_EVENTS = {
  invite: "member_invited",
  accept: "member_accepted",
  project: {
    add: "project_member_added",
    leave: "project_member_left",
  },
  workspace: {
    leave: "workspace_member_left",
  },
};

export const AUTH_TRACKER_EVENTS = {
  navigate: {
    sign_up: "navigate_to_sign_up_page",
    sign_in: "navigate_to_sign_in_page",
  },
  code_verify: "code_verified",
  sign_up_with_password: "sign_up_with_password",
  sign_in_with_password: "sign_in_with_password",
  sign_in_with_code: "sign_in_with_magic_link",
  forgot_password: "forgot_password_clicked",
};

export const PRODUCT_TOUR_TRACKER_EVENTS = {
  start: "product_tour_started",
  complete: "product_tour_completed",
  skip: "product_tour_skipped",
};

export const GLOBAL_VIEW_TOUR_TRACKER_EVENTS = {
  create: "global_view_created",
  update: "global_view_updated",
  delete: "global_view_deleted",
  open: "global_view_opened",
};

export const NOTIFICATION_TRACKER_EVENTS = {
  archive: "notification_archived",
  all_marked_read: "all_notifications_marked_read",
};

export const USER_TRACKER_EVENTS = {
  add_details: "user_details_added",
  onboarding_complete: "user_onboarding_completed",
};

export const ONBOARDING_TRACKER_EVENTS = {
  root: "onboarding",
  step_1: "onboarding_step_1",
  step_2: "onboarding_step_2",
};

export const SIDEBAR_TRACKER_EVENTS = {
  click: "sidenav_clicked",
};
