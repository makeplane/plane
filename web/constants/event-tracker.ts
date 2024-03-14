import { ISSUE_ORDER_BY_OPTIONS } from "./issue";

export type IssueEventProps = {
  eventName: string;
  payload: any;
  updates?: any;
  routePath?: string;
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
  change_details: payload.change_details,
  element: payload.element,
});

export const getProjectEventPayload = (payload: any) => ({
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
  const { eventName, payload, updates, routePath } = props;
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
    view_id: routePath?.includes("workspace-views") || routePath?.includes("views") ? routePath.split("/").pop() : "",
  };

  if (eventName === ISSUE_UPDATED) {
    eventPayload = {
      ...eventPayload,
      ...updates,
      updated_from: elementFromPath(routePath),
    };
  }
  return eventPayload;
};

export const getProjectStateEventPayload = (payload: any) => ({
  state_id: payload.id,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  group: payload.group,
  color: payload.color,
  default: payload.default,
  state: payload.state,
  element: payload.element,
  change_details: payload.change_details,
});

export const getIssuesListOpenedPayload = (payload: any) => ({
  ...elementFromPath(payload?.routePath),
  layout: payload?.displayFilters?.layout,
  filters: payload?.filters,
  display_properties: payload?.displayProperties,
});

export const getIssuesFilterEventPayload = (payload: any) => ({
  filter_type: payload?.filter_type,
  filter_property: payload?.filter_property,
  layout: payload?.filters?.displayFilters?.layout,
  current_filters: payload?.filters?.filters,
  ...elementFromPath(payload?.routePath),
});

export const getIssuesDisplayFilterPayload = (payload: any) => {
  const property =
    payload.property_type == "order_by"
      ? ISSUE_ORDER_BY_OPTIONS?.filter((option) => option.key === payload.property)?.[0]
          .title.toLocaleLowerCase()
          .replaceAll(" ", "_")
      : payload.property;
  return {
    layout: payload?.filters?.displayFilters?.layout,
    current_display_properties: payload?.filters?.displayProperties,
    ...elementFromPath(payload?.routePath),
    display_property: payload.display_property,
    property: property,
    property_type: payload.property_type,
  };
};

export const elementFromPath = (routePath?: string) => {
  routePath = routePath?.split("?")?.[0];
  if (!routePath) return;

  let element = "Dashboard";
  if (routePath.includes("workspace-views")) element = "Global view";
  else if (routePath.includes("cycles")) element = "Cycle";
  else if (routePath.includes("modules")) element = "Module";
  else if (routePath.includes("pages")) element = "Project page";
  else if (routePath.includes("views")) element = "Project view";
  else if (routePath.includes("profile")) element = "Profile";
  else if (routePath.includes("inbox")) element = "Inbox";
  else if (routePath.includes("draft")) element = "Draft";
  else if (routePath.includes("archived")) element = "Archive";
  else if (routePath.includes("projects")) element = "Project";

  return {
    element: element,
    element_id: ["Project", "Draft", "Archive"].includes(element)
      ? routePath.split("/")?.at(-2)
      : routePath.split("/")?.at(-1),
  };
};

// Workspace CRUD Events
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
// Project View Events
export const VIEW_CREATED = "View created";
export const VIEW_UPDATED = "View updated";
export const VIEW_DELETED = "View deleted";
export const VIEW_FAVORITED = "View favorited";
export const VIEW_UNFAVORITED = "View unfavorited";
// Issue Events
export const ISSUE_CREATED = "Issue created";
export const ISSUE_UPDATED = "Issue updated";
export const ISSUE_DELETED = "Issue deleted";
export const ISSUE_ARCHIVED = "Issue archived";
export const ISSUE_RESTORED = "Issue restored";
// Comment Events
export const COMMENT_CREATED = "Comment created";
export const COMMENT_UPDATED = "Comment updated";
export const COMMENT_DELETED = "Comment deleted";
// Issue Checkout Events
export const ISSUES_LIST_OPENED = "Issues list opened";
export const ISSUE_OPENED = "Issue opened";
// Issues Filter Events
export const FILTER_APPLIED = "Filter applied";
export const FILTER_REMOVED = "Filter removed";
export const FILTER_SEARCHED = "Filter searched";
// Issues Display Property Events
export const DP_APPLIED = "Display property applied";
export const DP_REMOVED = "Display property removed";
// Issues Layout Property Event
export const LP_UPDATED = "Layout property updated";
export const LAYOUT_CHANGED = "Layout changed";
// Project State Events
export const STATE_CREATED = "State created";
export const STATE_UPDATED = "State updated";
export const STATE_DELETED = "State deleted";
// Label Events
export const LABEL_CREATED = "Label created";
export const LABEL_UPDATED = "Label updated";
export const LABEL_DELETED = "Label deleted";
export const LABEL_GROUP_DELETED = "Label group deleted";
export const LABEL_ADDED_G = "Label added to group";
export const LABEL_REMOVED_G = "Label removed from group";
// Project Automation events
export const AUTO_ARCHIVE_TOGGLED = "Auto archive toggled";
export const AUTO_ARCHIVE_UPDATED = "Auto archive updated";
export const AUTO_CLOSE_Toggled = "Auto close toggled";
export const AUTO_CLOSE_UPDATED = "Auto close updated";
// Estimate Events
export const ESTIMATE_CREATED = "Estimate created";
export const ESTIMATE_UPDATED = "Estimate updated";
export const ESTIMATE_DELETED = "Estimate deleted";
export const ESTIMATE_USED = "Estimate used";
export const ESTIMATE_DISABLED = "Estimate disabled";
// Project Page Events
export const PAGE_VIEWED = "Page viewed";
export const PAGE_CREATED = "Page created";
export const PAGE_UPDATED = "Page updated";
export const PAGE_DELETED = "Page deleted";
export const PAGE_FAVORITED = "Page favorited";
export const PAGE_UNFAVORITED = "Page unfavorited";
export const PAGE_ARCHIVED = "Page archived";
export const PAGE_LOCKED = "Page locked";
export const PAGE_UNLOCKED = "Page unlocked";
export const PAGE_DUPLICATED = "Page duplicated";
export const PAGE_RESTORED = "Page restored";
// AI Assistant Events
export const AI_TRIGGERED = "AI triggered";
export const AI_RES_USED = "AI response used";
export const AI_RES_REGENERATED = "AI response regenerated";
// Project Member Events
export const PROJECT_MEMBER_ADDED = "Project member added";
export const PROJECT_MEMBER_LEFT = "Project member left";
export const PROJECT_MEMBER_REMOVED = "Project member removed";
export const PM_ROLE_CHANGED = "Project member role changed";
// Workspace Member Events
export const MEMBER_INVITED = "Member invited";
export const MEMBER_ACCEPTED = "Member accepted";
export const WORKSPACE_MEMBER_REMOVED = "Workspace member removed";
export const WORKSPACE_MEMBER_LEFT = "Workspace member left";
export const WM_ROLE_CHANGED = "Workspace member role changed";
// Issues Export Events
export const ISSUES_EXPORTED = "Issues exported";
// Issues Import Events
export const GITHUB_ISSUES_IMPORTED = "Github issues imported";
export const JIRA_ISSUES_IMPORTED = "Jira issues imported";
// Webhook Events
export const WEBHOOK_CREATED = "Webhook created";
export const WEBHOOK_UPDATED = "Webhook updated";
export const WEBHOOK_DELETED = "Webhook deleted";
export const WEBHOOK_ENABLED = "Webhook enabled";
export const WEBHOOK_DISABLED = "Webhook diabled";
export const WEBHOOK_KEY_REGEN = "Webhook secret key regenerated";
// API Token Events
export const API_TOKEN_CREATED = "API token created";
export const API_TOKEN_UPDATED = "API token updated";
export const API_TOKEN_DELETED = "API token deleted";
export const API_TOKEN_REGEN = "API token regenerated";
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
export const E_PROJECT_PAGES = "Project pages page";