// Base URLS
export const BASE_PROD = "https://api.plane.so";
export const BASE_STAGING = "https://api.plane.so";
export const BASE_LOCAL = "http://localhost:8000";

// authentication urls
export const SIGN_IN_ENDPOINT = "/api/sign-in/";
export const SIGN_UP_ENDPOINT = "/api/sign-up/";
export const SIGN_OUT_ENDPOINT = "/api/sign-out/";
export const SOCIAL_AUTH_ENDPOINT = "/api/social-auth/";
export const MAGIC_LINK_GENERATE = "/api/magic-generate/";
export const MAGIC_LINK_SIGNIN = "/api/magic-sign-in/";

// user
export const USER_ENDPOINT = "/api/users/me/";
export const CHANGE_PASSWORD = "/api/users/me/change-password/";
export const USER_ONBOARD_ENDPOINT = "/api/users/me/onboard/";
export const USER_ISSUES_ENDPOINT = (workspaceSlug: string) =>
  `/api/workspaces/${workspaceSlug}/my-issues/`;
export const USER_WORKSPACES = "/api/users/me/workspaces";

// s3 file url
export const S3_URL = `/api/file-assets/`;

// LIST USER INVITATIONS ---- RESPOND INVITATIONS IN BULK
export const USER_WORKSPACE_INVITATIONS = "/api/users/me/invitations/workspaces/";
export const USER_PROJECT_INVITATIONS = "/api/users/me/invitations/projects/";
export const LAST_ACTIVE_WORKSPACE_AND_PROJECTS = "/api/users/last-visited-workspace/";
export const USER_WORKSPACE_INVITATION = (invitationId: string) =>
  `/api/users/me/invitations/${invitationId}/`;

export const JOIN_WORKSPACE = (workspaceSlug: string, invitationId: string) =>
  `/api/users/me/invitations/workspaces/${workspaceSlug}/${invitationId}/join/`;
export const JOIN_PROJECT = (workspaceSlug: string) =>
  `/api/workspaces/${workspaceSlug}/projects/join/`;

// workspaces
export const WORKSPACES_ENDPOINT = "/api/workspaces/";
export const WORKSPACE_DETAIL = (workspaceSlug: string) => `/api/workspaces/${workspaceSlug}/`;

export const INVITE_WORKSPACE = (workspaceSlug: string) =>
  `/api/workspaces/${workspaceSlug}/invite/`;

export const WORKSPACE_MEMBERS = (workspaceSlug: string) =>
  `/api/workspaces/${workspaceSlug}/members/`;
export const WORKSPACE_MEMBER_DETAIL = (workspaceSlug: string, memberId: string) =>
  `/api/workspaces/${workspaceSlug}/members/${memberId}/`;

export const WORKSPACE_INVITATIONS = (workspaceSlug: string) =>
  `/api/workspaces/${workspaceSlug}/invitations/`;
export const WORKSPACE_INVITATION_DETAIL = (workspaceSlug: string, invitationId: string) =>
  `/api/workspaces/${workspaceSlug}/invitations/${invitationId}/`;

// projects
export const PROJECTS_ENDPOINT = (workspaceSlug: string) =>
  `/api/workspaces/${workspaceSlug}/projects/`;
export const PROJECT_DETAIL = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/`;

export const INVITE_PROJECT = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/members/add/`;

export const PROJECT_MEMBERS = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/members/`;
export const PROJECT_MEMBER_DETAIL = (workspaceSlug: string, projectId: string, memberId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/members/${memberId}/`;
export const PROJECT_VIEW_ENDPOINT = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/project-views/`;

export const PROJECT_INVITATIONS = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/`;
export const PROJECT_INVITATION_DETAIL = (
  workspaceSlug: string,
  projectId: string,
  invitationId: string
) => `/api/workspaces/${workspaceSlug}/projects/${projectId}/invitations/${invitationId}/`;

export const CHECK_PROJECT_IDENTIFIER = (workspaceSlug: string) =>
  `/api/workspaces/${workspaceSlug}/project-identifiers`;

// issues
export const ISSUES_ENDPOINT = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`;
export const ISSUE_DETAIL = (workspaceSlug: string, projectId: string, issueId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`;
export const ISSUES_BY_STATE = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/?group_by=state`;
export const ISSUE_PROPERTIES_ENDPOINT = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/`;
export const ISSUE_COMMENTS = (workspaceSlug: string, projectId: string, issueId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`;
export const ISSUE_COMMENT_DETAIL = (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  commentId: string
) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`;
export const ISSUE_ACTIVITIES = (workspaceSlug: string, projectId: string, issueId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/history/`;

export const ISSUE_LABELS = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`;
export const ISSUE_LABEL_DETAILS = (workspaceSlug: string, projectId: string, labelId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`;

export const FILTER_STATE_ISSUES = (workspaceSlug: string, projectId: string, state: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/?state=${state}`;
export const BULK_DELETE_ISSUES = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/bulk-delete-issues/`;
export const BULK_ADD_ISSUES_TO_CYCLE = (
  workspaceSlug: string,
  projectId: string,
  cycleId: string
) => `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/bulk-assign-issues/`;

// states
export const STATES_ENDPOINT = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`;
export const STATE_DETAIL = (workspaceSlug: string, projectId: string, stateId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}/`;

// CYCLES
export const CYCLES_ENDPOINT = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`;
export const CYCLE_DETAIL = (workspaceSlug: string, projectId: string, cycleId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`;
export const REMOVE_ISSUE_FROM_CYCLE = (
  workspaceSlug: string,
  projectId: string,
  cycleId: string,
  bridgeId: string
) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/${bridgeId}/`;

// modules
export const MODULES_ENDPOINT = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/`;
export const MODULE_DETAIL = (workspaceSlug: string, projectId: string, moduleId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/`;
export const MODULE_ISSUES = (workspaceSlug: string, projectId: string, moduleId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-issues/`;
export const MODULE_ISSUE_DETAIL = (
  workspaceSlug: string,
  projectId: string,
  moduleId: string,
  issueId: string
) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-issues/${issueId}/`;
