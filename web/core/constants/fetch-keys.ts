import { IAnalyticsParams, IJiraMetadata } from "@plane/types";

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

const myIssuesParamsToKey = (params: any) => {
  const { assignees, created_by, labels, priority, state_group, subscriber, start_date, target_date } = params;

  let assigneesKey = assignees ? assignees.split(",") : [];
  let createdByKey = created_by ? created_by.split(",") : [];
  let stateGroupKey = state_group ? state_group.split(",") : [];
  let subscriberKey = subscriber ? subscriber.split(",") : [];
  let priorityKey = priority ? priority.split(",") : [];
  let labelsKey = labels ? labels.split(",") : [];
  const startDateKey = start_date ?? "";
  const targetDateKey = target_date ?? "";
  const type = params?.type ? params.type.toUpperCase() : "NULL";
  const groupBy = params?.group_by ? params.group_by.toUpperCase() : "NULL";
  const orderBy = params?.order_by ? params.order_by.toUpperCase() : "NULL";

  // sorting each keys in ascending order
  assigneesKey = assigneesKey.sort().join("_");
  createdByKey = createdByKey.sort().join("_");
  stateGroupKey = stateGroupKey.sort().join("_");
  subscriberKey = subscriberKey.sort().join("_");
  priorityKey = priorityKey.sort().join("_");
  labelsKey = labelsKey.sort().join("_");

  return `${assigneesKey}_${createdByKey}_${stateGroupKey}_${subscriberKey}_${priorityKey}_${type}_${groupBy}_${orderBy}_${labelsKey}_${startDateKey}_${targetDateKey}`;
};

export const CURRENT_USER = "CURRENT_USER";
export const USER_WORKSPACE_INVITATIONS = "USER_WORKSPACE_INVITATIONS";
export const USER_WORKSPACES_LIST = "USER_WORKSPACES_LIST";

export const WORKSPACE_DETAILS = (workspaceSlug: string) => `WORKSPACE_DETAILS_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_MEMBERS = (workspaceSlug: string) => `WORKSPACE_MEMBERS_${workspaceSlug.toUpperCase()}`;
export const WORKSPACE_MEMBERS_ME = (workspaceSlug: string) => `WORKSPACE_MEMBERS_ME${workspaceSlug.toUpperCase()}`;
export const WORKSPACE_INVITATIONS = (workspaceSlug: string) => `WORKSPACE_INVITATIONS_${workspaceSlug.toString()}`;
export const WORKSPACE_INVITATION = (invitationId: string) => `WORKSPACE_INVITATION_${invitationId}`;
export const LAST_ACTIVE_WORKSPACE_AND_PROJECTS = "LAST_ACTIVE_WORKSPACE_AND_PROJECTS";

export const PROJECTS_LIST = (
  workspaceSlug: string,
  params: {
    is_favorite: "all" | boolean;
  }
) => {
  if (!params) return `PROJECTS_LIST_${workspaceSlug.toUpperCase()}`;

  return `PROJECTS_LIST_${workspaceSlug.toUpperCase()}_${params.is_favorite.toString().toUpperCase()}`;
};
export const PROJECT_DETAILS = (projectId: string) => `PROJECT_DETAILS_${projectId.toUpperCase()}`;

export const PROJECT_MEMBERS = (projectId: string) => `PROJECT_MEMBERS_${projectId.toUpperCase()}`;
export const PROJECT_INVITATIONS = (projectId: string) => `PROJECT_INVITATIONS_${projectId.toString()}`;

export const PROJECT_ISSUES_LIST = (workspaceSlug: string, projectId: string) =>
  `PROJECT_ISSUES_LIST_${workspaceSlug.toUpperCase()}_${projectId.toUpperCase()}`;
export const PROJECT_ISSUES_LIST_WITH_PARAMS = (projectId: string, params?: any) => {
  if (!params) return `PROJECT_ISSUES_LIST_WITH_PARAMS_${projectId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `PROJECT_ISSUES_LIST_WITH_PARAMS_${projectId.toUpperCase()}_${paramsKey}`;
};
export const PROJECT_ARCHIVED_ISSUES_LIST_WITH_PARAMS = (projectId: string, params?: any) => {
  if (!params) return `PROJECT_ARCHIVED_ISSUES_LIST_WITH_PARAMS_${projectId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `PROJECT_ARCHIVED_ISSUES_LIST_WITH_PARAMS_${projectId.toUpperCase()}_${paramsKey}`;
};

export const PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS = (projectId: string, params?: any) => {
  if (!params) return `PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS${projectId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS${projectId.toUpperCase()}_${paramsKey}`;
};

export const GLOBAL_VIEWS_LIST = (workspaceSlug: string) => `GLOBAL_VIEWS_LIST_${workspaceSlug.toUpperCase()}`;
export const GLOBAL_VIEW_DETAILS = (globalViewId: string) => `GLOBAL_VIEW_DETAILS_${globalViewId.toUpperCase()}`;
export const GLOBAL_VIEW_ISSUES = (globalViewId: string) => `GLOBAL_VIEW_ISSUES_${globalViewId.toUpperCase()}`;

export const PROJECT_ISSUES_DETAILS = (issueId: string) => `PROJECT_ISSUES_DETAILS_${issueId.toUpperCase()}`;
export const PROJECT_ISSUES_PROPERTIES = (projectId: string) => `PROJECT_ISSUES_PROPERTIES_${projectId.toUpperCase()}`;
export const PROJECT_ISSUES_COMMENTS = (issueId: string) => `PROJECT_ISSUES_COMMENTS_${issueId.toUpperCase()}`;
export const PROJECT_ISSUES_ACTIVITY = (issueId: string) => `PROJECT_ISSUES_ACTIVITY_${issueId.toUpperCase()}`;
export const PROJECT_ISSUE_BY_STATE = (projectId: string) => `PROJECT_ISSUE_BY_STATE_${projectId.toUpperCase()}`;
export const PROJECT_ISSUE_LABELS = (projectId: string) => `PROJECT_ISSUE_LABELS_${projectId.toUpperCase()}`;
export const WORKSPACE_LABELS = (workspaceSlug: string) => `WORKSPACE_LABELS_${workspaceSlug.toUpperCase()}`;
export const PROJECT_GITHUB_REPOSITORY = (projectId: string) => `PROJECT_GITHUB_REPOSITORY_${projectId.toUpperCase()}`;

// cycles
export const CYCLES_LIST = (projectId: string) => `CYCLE_LIST_${projectId.toUpperCase()}`;
export const INCOMPLETE_CYCLES_LIST = (projectId: string) => `INCOMPLETE_CYCLES_LIST_${projectId.toUpperCase()}`;
export const CURRENT_CYCLE_LIST = (projectId: string) => `CURRENT_CYCLE_LIST_${projectId.toUpperCase()}`;
export const UPCOMING_CYCLES_LIST = (projectId: string) => `UPCOMING_CYCLES_LIST_${projectId.toUpperCase()}`;
export const DRAFT_CYCLES_LIST = (projectId: string) => `DRAFT_CYCLES_LIST_${projectId.toUpperCase()}`;
export const COMPLETED_CYCLES_LIST = (projectId: string) => `COMPLETED_CYCLES_LIST_${projectId.toUpperCase()}`;
export const CYCLE_ISSUES = (cycleId: string) => `CYCLE_ISSUES_${cycleId.toUpperCase()}`;
export const CYCLE_ISSUES_WITH_PARAMS = (cycleId: string, params?: any) => {
  if (!params) return `CYCLE_ISSUES_WITH_PARAMS_${cycleId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `CYCLE_ISSUES_WITH_PARAMS_${cycleId.toUpperCase()}_${paramsKey.toUpperCase()}`;
};
export const CYCLE_DETAILS = (cycleId: string) => `CYCLE_DETAILS_${cycleId.toUpperCase()}`;

export const STATES_LIST = (projectId: string) => `STATES_LIST_${projectId.toUpperCase()}`;

export const USER_ISSUE = (workspaceSlug: string) => `USER_ISSUE_${workspaceSlug.toUpperCase()}`;
export const USER_ISSUES = (workspaceSlug: string, params: any) => {
  const paramsKey = myIssuesParamsToKey(params);

  return `USER_ISSUES_${workspaceSlug.toUpperCase()}_${paramsKey}`;
};
export const USER_ACTIVITY = (params: { cursor?: string }) => `USER_ACTIVITY_${params?.cursor}`;
export const USER_WORKSPACE_DASHBOARD = (workspaceSlug: string) =>
  `USER_WORKSPACE_DASHBOARD_${workspaceSlug.toUpperCase()}`;
export const USER_PROJECT_VIEW = (projectId: string) => `USER_PROJECT_VIEW_${projectId.toUpperCase()}`;

export const MODULE_LIST = (projectId: string) => `MODULE_LIST_${projectId.toUpperCase()}`;
export const MODULE_ISSUES = (moduleId: string) => `MODULE_ISSUES_${moduleId.toUpperCase()}`;
export const MODULE_ISSUES_WITH_PARAMS = (moduleId: string, params?: any) => {
  if (!params) return `MODULE_ISSUES_WITH_PARAMS_${moduleId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `MODULE_ISSUES_WITH_PARAMS_${moduleId.toUpperCase()}_${paramsKey.toUpperCase()}`;
};
export const MODULE_DETAILS = (moduleId: string) => `MODULE_DETAILS_${moduleId.toUpperCase()}`;

export const VIEWS_LIST = (projectId: string) => `VIEWS_LIST_${projectId.toUpperCase()}`;
export const VIEW_DETAILS = (viewId: string) => `VIEW_DETAILS_${viewId.toUpperCase()}`;
export const VIEW_ISSUES = (viewId: string, params: any) => {
  if (!params) return `VIEW_ISSUES_${viewId.toUpperCase()}`;

  const paramsKey = paramsToKey(params);

  return `VIEW_ISSUES_${viewId.toUpperCase()}_${paramsKey.toUpperCase()}`;
};

// Issues
export const ISSUE_DETAILS = (issueId: string) => `ISSUE_DETAILS_${issueId.toUpperCase()}`;
export const SUB_ISSUES = (issueId: string) => `SUB_ISSUES_${issueId.toUpperCase()}`;
export const ISSUE_ATTACHMENTS = (issueId: string) => `ISSUE_ATTACHMENTS_${issueId.toUpperCase()}`;
export const ARCHIVED_ISSUE_DETAILS = (issueId: string) => `ARCHIVED_ISSUE_DETAILS_${issueId.toUpperCase()}`;

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

// Pages
export const RECENT_PAGES_LIST = (projectId: string) => `RECENT_PAGES_LIST_${projectId.toUpperCase()}`;
export const ALL_PAGES_LIST = (projectId: string) => `ALL_PAGES_LIST_${projectId.toUpperCase()}`;
export const ARCHIVED_PAGES_LIST = (projectId: string) => `ARCHIVED_PAGES_LIST_${projectId.toUpperCase}`;
export const FAVORITE_PAGES_LIST = (projectId: string) => `FAVORITE_PAGES_LIST_${projectId.toUpperCase()}`;
export const PRIVATE_PAGES_LIST = (projectId: string) => `PRIVATE_PAGES_LIST_${projectId.toUpperCase()}`;
export const SHARED_PAGES_LIST = (projectId: string) => `SHARED_PAGES_LIST_${projectId.toUpperCase()}`;
export const PAGE_DETAILS = (pageId: string) => `PAGE_DETAILS_${pageId.toUpperCase()}`;
export const PAGE_BLOCKS_LIST = (pageId: string) => `PAGE_BLOCK_LIST_${pageId.toUpperCase()}`;
export const PAGE_BLOCK_DETAILS = (pageId: string) => `PAGE_BLOCK_DETAILS_${pageId.toUpperCase()}`;
export const MY_PAGES_LIST = (pageId: string) => `MY_PAGE_LIST_${pageId}`;
// estimates
export const ESTIMATES_LIST = (projectId: string) => `ESTIMATES_LIST_${projectId.toUpperCase()}`;
export const ESTIMATE_DETAILS = (estimateId: string) => `ESTIMATE_DETAILS_${estimateId.toUpperCase()}`;

// analytics
export const ANALYTICS = (workspaceSlug: string, params: IAnalyticsParams) =>
  `ANALYTICS${workspaceSlug.toUpperCase()}_${params.x_axis}_${params.y_axis}_${
    params.segment
  }_${params.project?.toString()}`;
export const DEFAULT_ANALYTICS = (workspaceSlug: string, params?: Partial<IAnalyticsParams>) =>
  `DEFAULT_ANALYTICS_${workspaceSlug.toUpperCase()}_${params?.project?.toString()}_${params?.cycle}_${params?.module}`;

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
export const USER_PROFILE_ISSUES = (workspaceSlug: string, userId: string, params: any) => {
  const paramsKey = myIssuesParamsToKey(params);

  return `USER_PROFILE_ISSUES_${workspaceSlug.toUpperCase()}_${userId.toUpperCase()}_${paramsKey}`;
};

// reactions
export const ISSUE_REACTION_LIST = (workspaceSlug: string, projectId: string, issueId: string) =>
  `ISSUE_REACTION_LIST_${workspaceSlug.toUpperCase()}_${projectId.toUpperCase()}_${issueId.toUpperCase()}`;
export const COMMENT_REACTION_LIST = (workspaceSlug: string, projectId: string, commendId: string) =>
  `COMMENT_REACTION_LIST_${workspaceSlug.toUpperCase()}_${projectId.toUpperCase()}_${commendId.toUpperCase()}`;

// api-tokens
export const API_TOKENS_LIST = (workspaceSlug: string) => `API_TOKENS_LIST_${workspaceSlug.toUpperCase()}`;
export const API_TOKEN_DETAILS = (workspaceSlug: string, tokenId: string) =>
  `API_TOKEN_DETAILS_${workspaceSlug.toUpperCase()}_${tokenId.toUpperCase()}`;
