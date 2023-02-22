export const CURRENT_USER = "CURRENT_USER";
export const USER_WORKSPACE_INVITATIONS = "USER_WORKSPACE_INVITATIONS";
export const USER_WORKSPACES = "USER_WORKSPACES";
export const APP_INTEGRATIONS = "APP_INTEGRATIONS";

export const WORKSPACE_DETAILS = (workspaceSlug: string) => `WORKSPACE_DETAILS_${workspaceSlug}`;
export const WORKSPACE_INTEGRATIONS = (workspaceSlug: string) =>
  `WORKSPACE_INTEGRATIONS_${workspaceSlug}`;

export const WORKSPACE_MEMBERS = (workspaceSlug: string) => `WORKSPACE_MEMBERS_${workspaceSlug}`;
export const WORKSPACE_MEMBERS_ME = (workspaceSlug: string) =>
  `WORKSPACE_MEMBERS_ME${workspaceSlug}`;
export const WORKSPACE_INVITATIONS = "WORKSPACE_INVITATIONS";
export const WORKSPACE_INVITATION = "WORKSPACE_INVITATION";
export const LAST_ACTIVE_WORKSPACE_AND_PROJECTS = "LAST_ACTIVE_WORKSPACE_AND_PROJECTS";

export const PROJECTS_LIST = (workspaceSlug: string) => `PROJECTS_LIST_${workspaceSlug}`;
export const PROJECT_DETAILS = (projectId: string) => `PROJECT_DETAILS_${projectId}`;

export const PROJECT_MEMBERS = (projectId: string) => `PROJECT_MEMBERS_${projectId}`;
export const PROJECT_INVITATIONS = "PROJECT_INVITATIONS";

export const PROJECT_ISSUES_LIST = (workspaceSlug: string, projectId: string) =>
  `PROJECT_ISSUES_LIST_${workspaceSlug}_${projectId}`;
export const PROJECT_ISSUES_DETAILS = (issueId: string) => `PROJECT_ISSUES_DETAILS_${issueId}`;
export const PROJECT_ISSUES_PROPERTIES = (projectId: string) =>
  `PROJECT_ISSUES_PROPERTIES_${projectId}`;
export const PROJECT_ISSUES_COMMENTS = (issueId: string) => `PROJECT_ISSUES_COMMENTS_${issueId}`;
export const PROJECT_ISSUES_ACTIVITY = (issueId: string) => `PROJECT_ISSUES_ACTIVITY_${issueId}`;
export const PROJECT_ISSUE_BY_STATE = (projectId: string) => `PROJECT_ISSUE_BY_STATE_${projectId}`;
export const PROJECT_ISSUE_LABELS = (projectId: string) => `PROJECT_ISSUE_LABELS_${projectId}`;

export const CYCLE_LIST = (projectId: string) => `CYCLE_LIST_${projectId}`;
export const CYCLE_ISSUES = (cycleId: string) => `CYCLE_ISSUES_${cycleId}`;
export const CYCLE_DETAILS = (cycleId: string) => `CYCLE_DETAIL_${cycleId}`;

export const STATE_LIST = (projectId: string) => `STATE_LIST_${projectId}`;
export const STATE_DETAIL = "STATE_DETAIL";

export const USER_ISSUE = (workspaceSlug: string) => `USER_ISSUE_${workspaceSlug}`;
export const USER_PROJECT_VIEW = (projectId: string) => `USER_PROJECT_VIEW_${projectId}`;

export const MODULE_LIST = (projectId: string) => `MODULE_LIST_${projectId}`;
export const MODULE_ISSUES = (moduleId: string) => `MODULE_ISSUES_${moduleId}`;
export const MODULE_DETAILS = (moduleId: string) => `MODULE_DETAIL_${moduleId}`;

// Issues
export const ISSUE_DETAILS = (issueId: string) => `ISSUE_DETAILS_${issueId}`;
export const SUB_ISSUES = (issueId: string) => `SUB_ISSUES_${issueId}`;
