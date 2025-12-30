import type { EUserPermissions, IJiraMetadata } from "@plane/types";

const paramsToKey = (params: any) => {
  const {
    state,
    state_group,
    priority,
    mentions,
    assignees,
    created_by,
    labels,
    start_date,
    target_date,
    sub_issue,
    project,
    layout,
    subscriber,
  } = params;

  let projectKey = project ? project.split(",") : [];
  let stateKey = state ? state.split(",") : [];
  let stateGroupKey = state_group ? state_group.split(",") : [];
  let priorityKey = priority ? priority.split(",") : [];
  let mentionsKey = mentions ? mentions.split(",") : [];
  let assigneesKey = assignees ? assignees.split(",") : [];
  let createdByKey = created_by ? created_by.split(",") : [];
  let labelsKey = labels ? labels.split(",") : [];
  let subscriberKey = subscriber ? subscriber.split(",") : [];
  const startDateKey = start_date ?? "";
  const targetDateKey = target_date ?? "";
  const type = params.type ? params.type.toUpperCase() : "NULL";
  const groupBy = params.group_by ? params.group_by.toUpperCase() : "NULL";
  const orderBy = params.order_by ? params.order_by.toUpperCase() : "NULL";
  const layoutKey = layout ? layout.toUpperCase() : "";

  // sorting each keys in ascending order
  projectKey = projectKey.sort().join("_");
  stateKey = stateKey.sort().join("_");
  stateGroupKey = stateGroupKey.sort().join("_");
  priorityKey = priorityKey.sort().join("_");
  assigneesKey = assigneesKey.sort().join("_");
  mentionsKey = mentionsKey.sort().join("_");
  createdByKey = createdByKey.sort().join("_");
  labelsKey = labelsKey.sort().join("_");
  subscriberKey = subscriberKey.sort().join("_");

  return `${layoutKey}_${projectKey}_${stateGroupKey}_${stateKey}_${priorityKey}_${assigneesKey}_${mentionsKey}_${createdByKey}_${type}_${groupBy}_${orderBy}_${labelsKey}_${startDateKey}_${targetDateKey}_${sub_issue}_${subscriberKey}`;
};

export const USER_WORKSPACES_LIST = "USER_WORKSPACES_LIST";

export const WORKSPACE_PARTIAL_PROJECTS = (workspaceSlug: string) =>
  `WORKSPACE_PARTIAL_PROJECTS_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_MEMBERS = (workspaceSlug: string) => `WORKSPACE_MEMBERS_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_MODULES = (workspaceSlug: string) => `WORKSPACE_MODULES_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_CYCLES = (workspaceSlug: string) => `WORKSPACE_CYCLES_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_LABELS = (workspaceSlug: string) => `WORKSPACE_LABELS_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_ESTIMATES = (workspaceSlug: string) => `WORKSPACE_ESTIMATES_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_WORKFLOW_STATES = (workspaceSlug: string) =>
  `WORKSPACE_WORKFLOW_STATES_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_INVITATION = (invitationId: string) => `WORKSPACE_INVITATION_${invitationId}`;

export const WORKSPACE_MEMBER_ME_INFORMATION = (workspaceSlug: string) =>
  `WORKSPACE_MEMBER_ME_INFORMATION_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_MEMBER_ACTIVITY = (workspaceSlug: string) =>
  `WORKSPACE_MEMBER_ACTIVITY_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_PROJECTS_ROLES_INFORMATION = (workspaceSlug: string) =>
  `WORKSPACE_PROJECTS_ROLES_INFORMATION_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_FAVORITE = (workspaceSlug: string) => `WORKSPACE_FAVORITE_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_STATES = (workspaceSlug: string) => `WORKSPACE_STATES_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_SIDEBAR_PREFERENCES = (workspaceSlug: string) =>
  `WORKSPACE_SIDEBAR_PREFERENCES_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_PROJECT_NAVIGATION_PREFERENCES = (workspaceSlug: string) =>
  `WORKSPACE_PROJECT_NAVIGATION_PREFERENCES_${workspaceSlug.toUpperCase()}`;

export const PROJECT_GITHUB_REPOSITORY = (projectId: string) => `PROJECT_GITHUB_REPOSITORY_${projectId.toUpperCase()}`;

// cycles
export const WORKSPACE_ACTIVE_CYCLES_LIST = (workspaceSlug: string, cursor: string, per_page: string) =>
  `WORKSPACE_ACTIVE_CYCLES_LIST_${workspaceSlug.toUpperCase()}_${cursor.toUpperCase()}_${per_page.toUpperCase()}`;
export const CYCLE_ISSUES_WITH_PARAMS = (cycleId: string, params?: any) => {
  if (!params) return `CYCLE_ISSUES_WITH_PARAMS_${cycleId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `CYCLE_ISSUES_WITH_PARAMS_${cycleId.toUpperCase()}_${paramsKey.toUpperCase()}`;
};

export const USER_ACTIVITY = (params: { cursor?: string }) => `USER_ACTIVITY_${params?.cursor}`;

// Issues
export const ISSUE_DETAILS = (issueId: string) => `ISSUE_DETAILS_${issueId.toUpperCase()}`;

// integrations
export const APP_INTEGRATIONS = "APP_INTEGRATIONS";
export const WORKSPACE_INTEGRATIONS = (workspaceSlug: string) =>
  `WORKSPACE_INTEGRATIONS_${workspaceSlug.toUpperCase()}`;

export const JIRA_IMPORTER_DETAIL = (workspaceSlug: string, params: IJiraMetadata) => {
  const { api_token, cloud_hostname, email, project_key } = params;

  return `JIRA_IMPORTER_DETAIL_${workspaceSlug.toUpperCase()}_${api_token}_${cloud_hostname}_${email}_${project_key}`;
};

//import-export
export const IMPORTER_SERVICES_LIST = (workspaceSlug: string) =>
  `IMPORTER_SERVICES_LIST_${workspaceSlug.toUpperCase()}`;

//export
export const EXPORT_SERVICES_LIST = (workspaceSlug: string, cursor: string, per_page: string) =>
  `EXPORTER_SERVICES_LIST_${workspaceSlug.toUpperCase()}_${cursor.toUpperCase()}_${per_page.toUpperCase()}`;

// github-importer
export const GITHUB_REPOSITORY_INFO = (workspaceSlug: string, repoName: string) =>
  `GITHUB_REPO_INFO_${workspaceSlug.toString().toUpperCase()}_${repoName.toUpperCase()}`;

// slack-project-integration
export const SLACK_CHANNEL_INFO = (workspaceSlug: string, projectId: string) =>
  `SLACK_CHANNEL_INFO_${workspaceSlug.toString().toUpperCase()}_${projectId.toUpperCase()}`;

// profile
export const USER_PROFILE_DATA = (workspaceSlug: string, userId: string) =>
  `USER_PROFILE_ACTIVITY_${workspaceSlug.toUpperCase()}_${userId.toUpperCase()}`;
export const USER_PROFILE_ACTIVITY = (
  workspaceSlug: string,
  userId: string,
  params: {
    cursor?: string;
  }
) => `USER_WORKSPACE_PROFILE_ACTIVITY_${workspaceSlug.toUpperCase()}_${userId.toUpperCase()}_${params?.cursor}`;
export const USER_PROFILE_PROJECT_SEGREGATION = (workspaceSlug: string, userId: string) =>
  `USER_PROFILE_PROJECT_SEGREGATION_${workspaceSlug.toUpperCase()}_${userId.toUpperCase()}`;

// api-tokens
export const API_TOKENS_LIST = `API_TOKENS_LIST`;

// marketplace
export const APPLICATIONS_LIST = (workspaceSlug: string) => `APPLICATIONS_LIST_${workspaceSlug.toUpperCase()}`;
export const APPLICATION_DETAILS = (applicationId: string) => `APPLICATION_DETAILS_${applicationId.toUpperCase()}`;
export const APPLICATION_BY_CLIENT_ID = (clientId: string) => `APPLICATION_BY_CLIENT_ID_${clientId.toUpperCase()}`;
export const APPLICATION_CATEGORIES_LIST = () => `APPLICATION_CATEGORIES_LIST`;

// project level keys
export const PROJECT_DETAILS = (workspaceSlug: string, projectId: string) =>
  `PROJECT_DETAILS_${projectId.toString().toUpperCase()}`;

export const PROJECT_ME_INFORMATION = (workspaceSlug: string, projectId: string) =>
  `PROJECT_ME_INFORMATION_${projectId.toString().toUpperCase()}`;

export const PROJECT_LABELS = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_LABELS_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_MEMBERS = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_MEMBERS_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_STATES = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_STATES_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_INTAKE_STATE = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_INTAKE_STATE_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_ESTIMATES = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_ESTIMATES_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_ALL_CYCLES = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_ALL_CYCLES_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_MODULES = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_MODULES_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_VIEWS = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_VIEWS_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_MEMBER_PREFERENCES = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_MEMBER_PREFERENCES_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_WORKFLOWS = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_WORKFLOWS_${projectId.toString().toUpperCase()}_${projectRole}`;

export const EPICS_PROPERTIES_AND_OPTIONS = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `EPICS_PROPERTIES_AND_OPTIONS_${projectId.toString().toUpperCase()}_${projectRole}`;

export const WORK_ITEM_TYPES_PROPERTIES_AND_OPTIONS = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `WORK_ITEM_TYPES_PROPERTIES_AND_OPTIONS_${projectId.toString().toUpperCase()}_${projectRole}`;

export const PROJECT_MILESTONES = (projectId: string, projectRole: EUserPermissions | undefined) =>
  `PROJECT_MILESTONES_${projectId.toString().toUpperCase()}_${projectRole}`;
