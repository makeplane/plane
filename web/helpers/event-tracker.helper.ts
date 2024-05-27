import {
  // elements
  E_ARCHIVE,
  E_CYCLE,
  E_DASHBOARD,
  E_DRAFT,
  E_INBOX,
  E_MODULE,
  E_PROFILE,
  E_PROJECT,
  E_PROJECT_VIEW,
  E_WORKSPACE_VIEW,
  // events
  ISSUE_UPDATED,
  // types
  IssueEventProps,
} from "@/constants/event-tracker";

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
      updated_from: getElementFromPath(routePath),
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

export const getIssuesListOpenedPayload = (payload: any) => ({
  type: payload.project_id ? "Project" : "Workspace",
  layout: payload?.filters?.displayFilters?.layout,
  filters: payload?.filters?.filters,
  display_properties: payload?.filters?.displayProperties,
  workspace_id: payload.workspace_id,
  project_id: payload.project_id,
});

// Returns the element based on the path
export const getElementFromPath = (routePath?: string) => {
  if (routePath?.includes("workspace-views")) return E_WORKSPACE_VIEW;
  if (routePath?.includes("profile")) return E_PROFILE;
  if (routePath?.includes("cycles")) return E_CYCLE;
  if (routePath?.includes("modules")) return E_MODULE;
  if (routePath?.includes("views")) return E_PROJECT_VIEW;
  if (routePath?.includes("inbox")) return E_INBOX;
  if (routePath?.includes("draft")) return E_DRAFT;
  if (routePath?.includes("archives")) return E_ARCHIVE;
  if (routePath?.includes("projects")) return E_PROJECT;
  if (routePath?.split("/").length === 2) return E_DASHBOARD;
  return "";
};

export const getElementIdFromPath = (routePath?: string) => {
  const element = getElementFromPath(routePath);
  return [E_PROJECT, E_DRAFT].includes(element)
    ? routePath?.split("/").at(-2)
    : element === E_ARCHIVE
      ? routePath?.split("/").at(-3)
      : routePath?.split("/").at(-1);
};
