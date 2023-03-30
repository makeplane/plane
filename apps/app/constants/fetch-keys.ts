const paramsToKey = (params: any) => {
  const { state, priority, assignees, created_by, labels } = params;

  let stateKey = state ? state.split(",") : [];
  let priorityKey = priority ? priority.split(",") : [];
  let assigneesKey = assignees ? assignees.split(",") : [];
  let createdByKey = created_by ? created_by.split(",") : [];
  let labelsKey = labels ? labels.split(",") : [];
  const type = params.type ? params.type.toUpperCase() : "NULL";
  const groupBy = params.group_by ? params.group_by.toUpperCase() : "NULL";
  const orderBy = params.order_by ? params.order_by.toUpperCase() : "NULL";

  // sorting each keys in ascending order
  stateKey = stateKey.sort().join("_");
  priorityKey = priorityKey.sort().join("_");
  assigneesKey = assigneesKey.sort().join("_");
  createdByKey = createdByKey.sort().join("_");
  labelsKey = labelsKey.sort().join("_");

  return `${stateKey}_${priorityKey}_${assigneesKey}_${createdByKey}_${type}_${groupBy}_${orderBy}_${labelsKey}`;
};

export const CURRENT_USER = "CURRENT_USER";
export const USER_WORKSPACE_INVITATIONS = "USER_WORKSPACE_INVITATIONS";
export const USER_WORKSPACES = "USER_WORKSPACES";
export const APP_INTEGRATIONS = "APP_INTEGRATIONS";

export const WORKSPACE_DETAILS = (workspaceSlug: string) =>
  `WORKSPACE_DETAILS_${workspaceSlug.toUpperCase()}`;
export const WORKSPACE_INTEGRATIONS = (workspaceSlug: string) =>
  `WORKSPACE_INTEGRATIONS_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_MEMBERS = (workspaceSlug: string) =>
  `WORKSPACE_MEMBERS_${workspaceSlug.toUpperCase()}`;
export const WORKSPACE_MEMBERS_ME = (workspaceSlug: string) =>
  `WORKSPACE_MEMBERS_ME${workspaceSlug.toUpperCase()}`;
export const WORKSPACE_INVITATIONS = "WORKSPACE_INVITATIONS";
export const WORKSPACE_INVITATION = "WORKSPACE_INVITATION";
export const LAST_ACTIVE_WORKSPACE_AND_PROJECTS = "LAST_ACTIVE_WORKSPACE_AND_PROJECTS";

export const PROJECTS_LIST = (workspaceSlug: string) =>
  `PROJECTS_LIST_${workspaceSlug.toUpperCase()}`;
export const FAVORITE_PROJECTS_LIST = (workspaceSlug: string) =>
  `FAVORITE_PROJECTS_LIST_${workspaceSlug.toUpperCase()}`;
export const PROJECT_DETAILS = (projectId: string) => `PROJECT_DETAILS_${projectId.toUpperCase()}`;

export const PROJECT_MEMBERS = (projectId: string) => `PROJECT_MEMBERS_${projectId.toUpperCase()}`;
export const PROJECT_INVITATIONS = "PROJECT_INVITATIONS";

export const PROJECT_ISSUES_LIST = (workspaceSlug: string, projectId: string) =>
  `PROJECT_ISSUES_LIST_${workspaceSlug.toUpperCase()}_${projectId.toUpperCase()}`;
export const PROJECT_ISSUES_LIST_WITH_PARAMS = (projectId: string, params?: any) => {
  if (!params) return `PROJECT_ISSUES_LIST_WITH_PARAMS_${projectId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `PROJECT_ISSUES_LIST_WITH_PARAMS_${projectId.toUpperCase()}_${paramsKey}`;
};
export const PROJECT_ISSUES_DETAILS = (issueId: string) =>
  `PROJECT_ISSUES_DETAILS_${issueId.toUpperCase()}`;
export const PROJECT_ISSUES_PROPERTIES = (projectId: string) =>
  `PROJECT_ISSUES_PROPERTIES_${projectId.toUpperCase()}`;
export const PROJECT_ISSUES_COMMENTS = (issueId: string) =>
  `PROJECT_ISSUES_COMMENTS_${issueId.toUpperCase()}`;
export const PROJECT_ISSUES_ACTIVITY = (issueId: string) =>
  `PROJECT_ISSUES_ACTIVITY_${issueId.toUpperCase()}`;
export const PROJECT_ISSUE_BY_STATE = (projectId: string) =>
  `PROJECT_ISSUE_BY_STATE_${projectId.toUpperCase()}`;
export const PROJECT_ISSUE_LABELS = (projectId: string) =>
  `PROJECT_ISSUE_LABELS_${projectId.toUpperCase()}`;
export const PROJECT_GITHUB_REPOSITORY = (projectId: string) =>
  `PROJECT_GITHUB_REPOSITORY_${projectId.toUpperCase()}`;

export const CYCLE_LIST = (projectId: string) => `CYCLE_LIST_${projectId.toUpperCase()}`;
export const CYCLE_INCOMPLETE_LIST = (projectId: string) =>
  `CYCLE_INCOMPLETE_LIST_${projectId.toUpperCase()}`;
export const CYCLE_ISSUES = (cycleId: string) => `CYCLE_ISSUES_${cycleId.toUpperCase()}`;
export const CYCLE_ISSUES_WITH_PARAMS = (cycleId: string, params?: any) => {
  if (!params) return `CYCLE_ISSUES_WITH_PARAMS_${cycleId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `CYCLE_ISSUES_WITH_PARAMS_${cycleId.toUpperCase()}_${paramsKey.toUpperCase()}`;
};
export const CYCLE_DETAILS = (cycleId: string) => `CYCLE_DETAILS_${cycleId.toUpperCase()}`;
export const CYCLE_CURRENT_AND_UPCOMING_LIST = (projectId: string) =>
  `CYCLE_CURRENT_AND_UPCOMING_LIST_${projectId.toUpperCase()}`;
export const CYCLE_DRAFT_LIST = (projectId: string) =>
  `CYCLE_DRAFT_LIST_${projectId.toUpperCase()}`;
export const CYCLE_COMPLETE_LIST = (projectId: string) =>
  `CYCLE_COMPLETE_LIST_${projectId.toUpperCase()}`;

export const STATE_LIST = (projectId: string) => `STATE_LIST_${projectId.toUpperCase()}`;
export const STATE_DETAIL = "STATE_DETAILS";

export const USER_ISSUE = (workspaceSlug: string) => `USER_ISSUE_${workspaceSlug.toUpperCase()}`;
export const USER_ACTIVITY = "USER_ACTIVITY";
export const USER_WORKSPACE_DASHBOARD = (workspaceSlug: string) =>
  `USER_WORKSPACE_DASHBOARD_${workspaceSlug.toUpperCase()}`;
export const USER_PROJECT_VIEW = (projectId: string) =>
  `USER_PROJECT_VIEW_${projectId.toUpperCase()}`;

export const MODULE_LIST = (projectId: string) => `MODULE_LIST_${projectId.toUpperCase()}`;
export const MODULE_ISSUES = (moduleId: string) => `MODULE_ISSUES_${moduleId.toUpperCase()}`;
export const MODULE_ISSUES_WITH_PARAMS = (moduleId: string, params?: any) => {
  if (!params) return `MODULE_ISSUES_WITH_PARAMS_${moduleId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `MODULE_ISSUES_WITH_PARAMS_${moduleId}_${paramsKey.toUpperCase()}`;
};
export const MODULE_DETAILS = (moduleId: string) => `MODULE_DETAILS_${moduleId.toUpperCase()}`;

export const VIEWS_LIST = (projectId: string) => `VIEWS_LIST_${projectId.toUpperCase()}`;
export const VIEW_ISSUES = (viewId: string) => `VIEW_ISSUES_${viewId.toUpperCase()}`;
export const VIEW_DETAILS = (viewId: string) => `VIEW_DETAILS_${viewId.toUpperCase()}`;

// Issues
export const ISSUE_DETAILS = (issueId: string) => `ISSUE_DETAILS_${issueId.toUpperCase()}`;
export const SUB_ISSUES = (issueId: string) => `SUB_ISSUES_${issueId.toUpperCase()}`;

// integrations

// Calendar
export const PROJECT_CALENDAR_ISSUES = (projectId: string) =>
  `CALENDAR_ISSUES_${projectId.toUpperCase()}`;
export const CYCLE_CALENDAR_ISSUES = (projectId: string, cycleId: string) =>
  `CALENDAR_ISSUES_${projectId.toUpperCase()}_${cycleId.toUpperCase()}`;
export const MODULE_CALENDAR_ISSUES = (projectId: string, moduleId: string) =>
  `CALENDAR_ISSUES_${projectId.toUpperCase()}_${moduleId.toUpperCase()}`;

// Pages
export const RECENT_PAGES_LIST = (projectId: string) =>
  `RECENT_PAGES_LIST_${projectId.toUpperCase()}`;
export const ALL_PAGES_LIST = (projectId: string) => `ALL_PAGES_LIST_${projectId.toUpperCase()}`;
export const FAVORITE_PAGES_LIST = (projectId: string) =>
  `FAVORITE_PAGES_LIST_${projectId.toUpperCase()}`;
export const MY_PAGES_LIST = (projectId: string) => `MY_PAGES_LIST_${projectId.toUpperCase()}`;
export const OTHER_PAGES_LIST = (projectId: string) =>
  `OTHER_PAGES_LIST_${projectId.toUpperCase()}`;
export const PAGE_DETAILS = (pageId: string) => `PAGE_DETAILS_${pageId.toUpperCase()}`;
export const PAGE_BLOCKS_LIST = (pageId: string) => `PAGE_BLOCK_LIST_${pageId.toUpperCase()}`;
export const PAGE_BLOCK_DETAILS = (pageId: string) => `PAGE_BLOCK_DETAILS_${pageId.toUpperCase()}`;
