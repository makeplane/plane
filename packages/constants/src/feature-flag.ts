export enum E_FEATURE_FLAGS {
  BULK_OPS_ONE = "BULK_OPS_ONE",
  BULK_OPS_PRO = "BULK_OPS_PRO",
  COLLABORATION_CURSOR = "COLLABORATION_CURSOR",
  EDITOR_AI_OPS = "EDITOR_AI_OPS",
  ESTIMATE_WITH_TIME = "ESTIMATE_WITH_TIME",
  ISSUE_TYPES = "ISSUE_TYPES",
  EPICS = "EPICS",
  OIDC_SAML_AUTH = "OIDC_SAML_AUTH",
  PAGE_ISSUE_EMBEDS = "PAGE_ISSUE_EMBEDS",
  PAGE_PUBLISH = "PAGE_PUBLISH",
  MOVE_PAGES = "MOVE_PAGES",
  VIEW_ACCESS_PRIVATE = "VIEW_ACCESS_PRIVATE",
  VIEW_LOCK = "VIEW_LOCK",
  VIEW_PUBLISH = "VIEW_PUBLISH",
  WORKSPACE_ACTIVE_CYCLES = "WORKSPACE_ACTIVE_CYCLES",
  WORKSPACE_PAGES = "WORKSPACE_PAGES",
  ISSUE_WORKLOG = "ISSUE_WORKLOG",
  PROJECT_GROUPING = "PROJECT_GROUPING",
  CYCLE_PROGRESS_CHARTS = "CYCLE_PROGRESS_CHARTS",
  FILE_SIZE_LIMIT_PRO = "FILE_SIZE_LIMIT_PRO",
  TIMELINE_DEPENDENCY = "TIMELINE_DEPENDENCY",
  TEAMSPACES = "TEAMSPACES",
  INBOX_STACKING = "INBOX_STACKING",
  PROJECT_OVERVIEW = "PROJECT_OVERVIEW",
  PROJECT_UPDATES = "PROJECT_UPDATES",
  CYCLE_MANUAL_START_STOP = "CYCLE_MANUAL_START_STOP",
  HOME_ADVANCED = "HOME_ADVANCED",
  ADVANCED_SEARCH = "ADVANCED_SEARCH",
  WORKFLOWS = "WORKFLOWS",
  CUSTOMERS = "CUSTOMERS",

  // ====== silo importers ======
  SILO_IMPORTERS = "SILO_IMPORTERS",

  FLATFILE_IMPORTER = "FLATFILE_IMPORTER",

  JIRA_IMPORTER = "JIRA_IMPORTER",
  JIRA_ISSUE_TYPES_IMPORTER = "JIRA_ISSUE_TYPES_IMPORTER",

  JIRA_SERVER_IMPORTER = "JIRA_SERVER_IMPORTER",
  JIRA_SERVER_ISSUE_TYPES_IMPORTER = "JIRA_SERVER_ISSUE_TYPES_IMPORTER",

  LINEAR_IMPORTER = "LINEAR_IMPORTER",
  LINEAR_TEAMS_IMPORTER = "LINEAR_TEAMS_IMPORTER",

  ASANA_IMPORTER = "ASANA_IMPORTER",
  ASANA_ISSUE_PROPERTIES_IMPORTER = "ASANA_ISSUE_PROPERTIES_IMPORTER",

  // ==== silo ======
  SILO = "SILO",

  // ====== silo integrations ======
  SILO_INTEGRATIONS = "SILO_INTEGRATIONS",
  GITHUB_INTEGRATION = "GITHUB_INTEGRATION",

  GITLAB_INTEGRATION = "GITLAB_INTEGRATION",
  SLACK_INTEGRATION = "SLACK_INTEGRATION",

  // ====== silo deprecated ======
  SILO_JIRA_INTEGRATION = "SILO_JIRA_INTEGRATION", // DEPRECATED
  SILO_LINEAR_INTEGRATION = "SILO_LINEAR_INTEGRATION", // DEPRECATED
  SILO_INTEGRATION = "SILO_INTEGRATION", // DEPRECATED

  // intake
  INTAKE_SETTINGS = "INTAKE_SETTINGS",
  // PI
  PI_CHAT = "PI_CHAT",
  PI_DEDUPE = "PI_DEDUPE",
  // initiatives
  INITIATIVES = "INITIATIVES",
  // dashboards
  DASHBOARDS = "DASHBOARDS",
}
