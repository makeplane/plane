export const CURRENT_USER = "CURRENT_USER";
export const USER_WORKSPACE_INVITATIONS = "USER_WORKSPACE_INVITATIONS";
export const USER_WORKSPACES = "USER_WORKSPACES";

export const WORKSPACE_MEMBERS = (workspaceSlug: string) => `WORKSPACE_MEMBERS_${workspaceSlug}`;
export const WORKSPACE_INVITATIONS = "WORKSPACE_INVITATIONS";
export const WORKSPACE_INVITATION = "WORKSPACE_INVITATION";

export const PROJECTS_LIST = (workspaceSlug: string) => `PROJECTS_LIST_${workspaceSlug}`;
export const PROJECT_DETAILS = (projectId: string) => `PROJECT_DETAILS_${projectId}`;

export const PROJECT_MEMBERS = (projectId: string) => `PROJECT_MEMBERS_${projectId}`;
export const PROJECT_INVITATIONS = "PROJECT_INVITATIONS";

export const PROJECT_ISSUES_LIST = (workspaceSlug: string, projectId: string) =>
  `PROJECT_ISSUES_LIST_${workspaceSlug}_${projectId}`;
export const PROJECT_ISSUES_DETAILS = (issueId: string) => `PROJECT_ISSUES_DETAILS_${issueId}`;
export const PROJECT_ISSUES_PROPERTIES = (projectId: string) =>
  `PROJECT_ISSUES_PROPERTIES_${projectId}`;
export const PROJECT_ISSUES_COMMENTS = "PROJECT_ISSUES_COMMENTS";
export const PROJECT_ISSUES_ACTIVITY = "PROJECT_ISSUES_ACTIVITY";
export const PROJECT_ISSUE_BY_STATE = (projectId: string) => `PROJECT_ISSUE_BY_STATE_${projectId}`;
export const PROJECT_ISSUE_LABELS = (projectId: string) => `PROJECT_ISSUE_LABELS_${projectId}`;

export const CYCLE_LIST = (projectId: string) => `CYCLE_LIST_${projectId}`;
export const CYCLE_ISSUES = (sprintId: string) => `CYCLE_ISSUES_${sprintId}`;
export const CYCLE_DETAIL = "CYCLE_DETAIL";

export const STATE_LIST = (projectId: string) => `STATE_LIST_${projectId}`;
export const STATE_DETAIL = "STATE_DETAIL";

export const USER_ISSUE = (workspaceSlug: string) => `USER_ISSUE_${workspaceSlug}`;
