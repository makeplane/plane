import { EUserPermissions } from "ee/constants/user-permissions";

export interface EmptyStateDetails {
  key: EmptyStateType;
  title?: string;
  description?: string;
  path?: string;
  primaryButton?: {
    icon?: React.ReactNode;
    text: string;
    comicBox?: {
      title?: string;
      description?: string;
    };
  };
  secondaryButton?: {
    icon?: React.ReactNode;
    text: string;
    comicBox?: {
      title?: string;
      description?: string;
    };
  };
  accessType?: "workspace" | "project";
  access?: any;
}

export enum EmptyStateType {
  WORKSPACE_DASHBOARD = "workspace-dashboard",
  WORKSPACE_ANALYTICS = "workspace-analytics",
  WORKSPACE_PROJECTS = "workspace-projects",
  WORKSPACE_TEAMS = "workspace-teams",
  WORKSPACE_INITIATIVES = "workspace-initiatives",
  WORKSPACE_INITIATIVES_EMPTY_SEARCH = "workspace-initiatives-empty-search",
  WORKSPACE_ALL_ISSUES = "workspace-all-issues",
  WORKSPACE_ASSIGNED = "workspace-assigned",
  WORKSPACE_CREATED = "workspace-created",
  WORKSPACE_SUBSCRIBED = "workspace-subscribed",
  WORKSPACE_CUSTOM_VIEW = "workspace-custom-view",
  WORKSPACE_NO_PROJECTS = "workspace-no-projects",
  WORKSPACE_PROJECT_NOT_FOUND = "workspace-project-not-found",
  WORKSPACE_SETTINGS_API_TOKENS = "workspace-settings-api-tokens",
  WORKSPACE_SETTINGS_WEBHOOKS = "workspace-settings-webhooks",
  WORKSPACE_SETTINGS_EXPORT = "workspace-settings-export",
  WORKSPACE_SETTINGS_IMPORT = "workspace-settings-import",
  PROFILE_ACTIVITY = "profile-activity",
  PROFILE_ASSIGNED = "profile-assigned",
  PROFILE_CREATED = "profile-created",
  PROFILE_SUBSCRIBED = "profile-subscribed",
  PROJECT_SETTINGS_LABELS = "project-settings-labels",
  PROJECT_SETTINGS_INTEGRATIONS = "project-settings-integrations",
  PROJECT_SETTINGS_ESTIMATE = "project-settings-estimate",
  PROJECT_CYCLES = "project-cycles",
  PROJECT_CYCLE_NO_ISSUES = "project-cycle-no-issues",
  PROJECT_CYCLE_ACTIVE = "project-cycle-active",
  PROJECT_CYCLE_ALL = "project-cycle-all",
  PROJECT_CYCLE_COMPLETED_NO_ISSUES = "project-cycle-completed-no-issues",
  PROJECT_ARCHIVED_NO_CYCLES = "project-archived-no-cycles",
  PROJECT_EMPTY_FILTER = "project-empty-filter",
  PROJECT_ARCHIVED_EMPTY_FILTER = "project-archived-empty-filter",
  PROJECT_DRAFT_EMPTY_FILTER = "project-draft-empty-filter",
  PROJECT_NO_ISSUES = "project-no-issues",
  PROJECT_ARCHIVED_NO_ISSUES = "project-archived-no-issues",
  PROJECT_DRAFT_NO_ISSUES = "project-draft-no-issues",
  VIEWS_EMPTY_SEARCH = "views-empty-search",
  PROJECTS_EMPTY_SEARCH = "projects-empty-search",
  MEMBERS_EMPTY_SEARCH = "members-empty-search",
  PROJECT_MODULE_ISSUES = "project-module-issues",
  PROJECT_MODULE = "project-module",
  PROJECT_ARCHIVED_NO_MODULES = "project-archived-no-modules",
  PROJECT_VIEW = "project-view",
  PROJECT_PAGE = "project-page",
  PROJECT_PAGE_PRIVATE = "project-page-private",
  PROJECT_PAGE_PUBLIC = "project-page-public",
  PROJECT_PAGE_ARCHIVED = "project-page-archived",
  WORKSPACE_PAGE = "workspace-page",
  WORKSPACE_PAGE_PRIVATE = "workspace-page-private",
  WORKSPACE_PAGE_PUBLIC = "workspace-page-public",
  WORKSPACE_PAGE_ARCHIVED = "workspace-page-archived",

  COMMAND_K_SEARCH_EMPTY_STATE = "command-k-search-empty-state",
  ISSUE_RELATION_SEARCH_EMPTY_STATE = "issue-relation-search-empty-state",
  ISSUE_RELATION_EMPTY_STATE = "issue-relation-empty-state",
  ISSUE_COMMENT_EMPTY_STATE = "issue-comment-empty-state",

  NOTIFICATION_DETAIL_EMPTY_STATE = "notification-detail-empty-state",
  NOTIFICATION_ALL_EMPTY_STATE = "notification-all-empty-state",
  NOTIFICATION_MENTIONS_EMPTY_STATE = "notification-mentions-empty-state",
  NOTIFICATION_MY_ISSUE_EMPTY_STATE = "notification-my-issues-empty-state",
  NOTIFICATION_CREATED_EMPTY_STATE = "notification-created-empty-state",
  NOTIFICATION_SUBSCRIBED_EMPTY_STATE = "notification-subscribed-empty-state",
  NOTIFICATION_ARCHIVED_EMPTY_STATE = "notification-archived-empty-state",
  NOTIFICATION_SNOOZED_EMPTY_STATE = "notification-snoozed-empty-state",
  NOTIFICATION_UNREAD_EMPTY_STATE = "notification-unread-empty-state",

  ACTIVE_CYCLE_PROGRESS_EMPTY_STATE = "active-cycle-progress-empty-state",
  ACTIVE_CYCLE_CHART_EMPTY_STATE = "active-cycle-chart-empty-state",
  ACTIVE_CYCLE_PRIORITY_ISSUE_EMPTY_STATE = "active-cycle-priority-issue-empty-state",
  ACTIVE_CYCLE_ASSIGNEE_EMPTY_STATE = "active-cycle-assignee-empty-state",
  ACTIVE_CYCLE_LABEL_EMPTY_STATE = "active-cycle-label-empty-state",

  WORKSPACE_ACTIVE_CYCLES = "workspace-active-cycles",
  DISABLED_PROJECT_INBOX = "disabled-project-inbox",
  DISABLED_PROJECT_CYCLE = "disabled-project-cycle",
  DISABLED_PROJECT_MODULE = "disabled-project-module",
  DISABLED_PROJECT_VIEW = "disabled-project-view",
  DISABLED_PROJECT_PAGE = "disabled-project-page",

  INBOX_SIDEBAR_OPEN_TAB = "inbox-sidebar-open-tab",
  INBOX_SIDEBAR_CLOSED_TAB = "inbox-sidebar-closed-tab",
  INBOX_SIDEBAR_FILTER_EMPTY_STATE = "inbox-sidebar-filter-empty-state",
  INBOX_DETAIL_EMPTY_STATE = "inbox-detail-empty-state",

  WORKSPACE_DRAFT_ISSUES = "workspace-draft-issues",

  PROJECT_NO_EPICS = "project-no-epics",
  // Teams
  TEAM_NO_ISSUES = "team-no-issues",
  TEAM_EMPTY_FILTER = "team-empty-filter",
  TEAM_VIEW = "team-view",
  TEAM_PAGE = "team-page",
}

const emptyStateDetails = {
  // workspace
  [EmptyStateType.WORKSPACE_DASHBOARD]: {
    key: EmptyStateType.WORKSPACE_DASHBOARD,
    title: "empty_state_workspace_dashboard_title",
    description: "empty_state_workspace_dashboard_description",
    path: "/empty-state/onboarding/dashboard",
    primaryButton: {
      text: "empty_state_workspace_dashboard_primary_button",
      comicBox: {
        title: "empty_state_workspace_dashboard_comic_title",
        description: "empty_state_workspace_dashboard_comic_description",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_ANALYTICS]: {
    key: EmptyStateType.WORKSPACE_ANALYTICS,
    title: "empty_state_workspace_analytics_title",
    description: "empty_state_workspace_analytics_description",
    path: "/empty-state/onboarding/analytics",
    primaryButton: {
      text: "empty_state_workspace_analytics_primary_button",
      comicBox: {
        title: "empty_state_workspace_analytics_comic_title",
        description: "empty_state_workspace_analytics_comic_description",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_PROJECTS]: {
    key: EmptyStateType.WORKSPACE_PROJECTS,
    title: "empty_state_workspace_projects_title",
    description: "empty_state_workspace_projects_description",
    path: "/empty-state/onboarding/projects",
    primaryButton: {
      text: "empty_state_workspace_projects_primary_button",
      comicBox: {
        title: "empty_state_workspace_projects_comic_title",
        description: "empty_state_workspace_projects_comic_description",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_TEAMS]: {
    key: EmptyStateType.WORKSPACE_TEAMS,
    title: "empty_state_workspace_teams_title",
    description: "empty_state_workspace_teams_description",
    path: "/empty-state/teams/teams",
    primaryButton: {
      text: "empty_state_workspace_teams_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN],
  },
  [EmptyStateType.WORKSPACE_INITIATIVES]: {
    key: EmptyStateType.WORKSPACE_INITIATIVES,
    title: "empty_state_workspace_initiatives_title",
    description: "empty_state_workspace_initiatives_description",
    path: "/empty-state/initiatives/initiatives",
    primaryButton: {
      text: "empty_state_workspace_initiatives_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_INITIATIVES_EMPTY_SEARCH]: {
    key: EmptyStateType.WORKSPACE_INITIATIVES_EMPTY_SEARCH,
    title: "empty_state_workspace_initiatives_empty_search_title",
    description: "empty_state_workspace_initiatives_empty_search_description",
    path: "/empty-state/search/project",
  },
  // all-issues
  [EmptyStateType.WORKSPACE_ALL_ISSUES]: {
    key: EmptyStateType.WORKSPACE_ALL_ISSUES,
    title: "empty_state_workspace_all_issues_title",
    description: "empty_state_workspace_all_issues_description",
    path: "/empty-state/all-issues/all-issues",
    primaryButton: {
      text: "empty_state_workspace_all_issues_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_ASSIGNED]: {
    key: EmptyStateType.WORKSPACE_ASSIGNED,
    title: "empty_state_workspace_assigned_title",
    description: "empty_state_workspace_assigned_description",
    path: "/empty-state/all-issues/assigned",
    primaryButton: {
      text: "empty_state_workspace_assigned_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_CREATED]: {
    key: EmptyStateType.WORKSPACE_CREATED,
    title: "empty_state_workspace_created_title",
    description: "empty_state_workspace_created_description",
    path: "/empty-state/all-issues/created",
    primaryButton: {
      text: "empty_state_workspace_created_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_SUBSCRIBED]: {
    key: EmptyStateType.WORKSPACE_SUBSCRIBED,
    title: "empty_state_workspace_subscribed_title",
    description: "empty_state_workspace_subscribed_description",
    path: "/empty-state/all-issues/subscribed",
  },
  [EmptyStateType.WORKSPACE_CUSTOM_VIEW]: {
    key: EmptyStateType.WORKSPACE_CUSTOM_VIEW,
    title: "empty_state_workspace_custom_view_title",
    description: "empty_state_workspace_custom_view_description",
    path: "/empty-state/all-issues/custom-view",
  },
  [EmptyStateType.WORKSPACE_PROJECT_NOT_FOUND]: {
    key: EmptyStateType.WORKSPACE_PROJECT_NOT_FOUND,
    title: "empty_state_workspace_project_not_found_title",
    description: "empty_state_workspace_project_not_found_description",
    path: "/empty-state/onboarding/projects",
    primaryButton: {
      text: "empty_state_workspace_project_not_found_primary_button",
      comicBox: {
        title: "empty_state_workspace_project_not_found_comic_title",
        description: "empty_state_workspace_project_not_found_comic_description",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_NO_PROJECTS]: {
    key: EmptyStateType.WORKSPACE_NO_PROJECTS,
    title: "empty_state_workspace_no_projects_title",
    description: "empty_state_workspace_no_projects_description",
    path: "/empty-state/onboarding/projects",
    primaryButton: {
      text: "empty_state_workspace_no_projects_primary_button",
      comicBox: {
        title: "empty_state_workspace_no_projects_comic_title",
        description: "empty_state_workspace_no_projects_comic_description",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  // workspace settings
  [EmptyStateType.WORKSPACE_SETTINGS_API_TOKENS]: {
    key: EmptyStateType.WORKSPACE_SETTINGS_API_TOKENS,
    title: "empty_state_workspace_settings_api_tokens_title",
    description: "empty_state_workspace_settings_api_tokens_description",
    path: "/empty-state/workspace-settings/api-tokens",
  },
  [EmptyStateType.WORKSPACE_SETTINGS_WEBHOOKS]: {
    key: EmptyStateType.WORKSPACE_SETTINGS_WEBHOOKS,
    title: "empty_state_workspace_settings_webhooks_title",
    description: "empty_state_workspace_settings_webhooks_description",
    path: "/empty-state/workspace-settings/webhooks",
  },
  [EmptyStateType.WORKSPACE_SETTINGS_EXPORT]: {
    key: EmptyStateType.WORKSPACE_SETTINGS_EXPORT,
    title: "empty_state_workspace_settings_export_title",
    description: "empty_state_workspace_settings_export_description",
    path: "/empty-state/workspace-settings/exports",
  },
  [EmptyStateType.WORKSPACE_SETTINGS_IMPORT]: {
    key: EmptyStateType.WORKSPACE_SETTINGS_IMPORT,
    title: "empty_state_workspace_settings_import_title",
    description: "empty_state_workspace_settings_import_description",
    path: "/empty-state/workspace-settings/imports",
  },
  // profile
  [EmptyStateType.PROFILE_ACTIVITY]: {
    key: EmptyStateType.PROFILE_ASSIGNED,
    title: "empty_state_profile_activity_title",
    description: "empty_state_profile_activity_description",
    path: "/empty-state/profile/activity",
  },
  [EmptyStateType.PROFILE_ASSIGNED]: {
    key: EmptyStateType.PROFILE_ASSIGNED,
    title: "empty_state_profile_assigned_title",
    description: "empty_state_profile_assigned_description",
    path: "/empty-state/profile/assigned",
  },
  [EmptyStateType.PROFILE_CREATED]: {
    key: EmptyStateType.PROFILE_CREATED,
    title: "empty_state_profile_created_title",
    description: "empty_state_profile_created_description",
    path: "/empty-state/profile/created",
  },
  [EmptyStateType.PROFILE_SUBSCRIBED]: {
    key: EmptyStateType.PROFILE_SUBSCRIBED,
    title: "empty_state_profile_subscribed_title",
    description: "empty_state_profile_subscribed_description",
    path: "/empty-state/profile/subscribed",
  },
  // project settings
  [EmptyStateType.PROJECT_SETTINGS_LABELS]: {
    key: EmptyStateType.PROJECT_SETTINGS_LABELS,
    title: "empty_state_project_settings_labels_title",
    description: "empty_state_project_settings_labels_description",
    path: "/empty-state/project-settings/labels",
  },
  [EmptyStateType.PROJECT_SETTINGS_INTEGRATIONS]: {
    key: EmptyStateType.PROJECT_SETTINGS_INTEGRATIONS,
    title: "empty_state_project_settings_integrations_title",
    description: "empty_state_project_settings_integrations_description",
    path: "/empty-state/project-settings/integrations",
  },
  [EmptyStateType.PROJECT_SETTINGS_ESTIMATE]: {
    key: EmptyStateType.PROJECT_SETTINGS_ESTIMATE,
    title: "empty_state_project_settings_estimate_title",
    description: "empty_state_project_settings_estimate_description",
    path: "/empty-state/project-settings/estimates",
  },
  // project cycles
  [EmptyStateType.PROJECT_CYCLES]: {
    key: EmptyStateType.PROJECT_CYCLES,
    title: "empty_state_project_cycles_title",
    description: "empty_state_project_cycles_description",
    path: "/empty-state/onboarding/cycles",
    primaryButton: {
      text: "empty_state_project_cycles_primary_button",
      comicBox: {
        title: "empty_state_project_cycles_comic_title",
        description: "empty_state_project_cycles_comic_description",
      },
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },

  [EmptyStateType.PROJECT_CYCLE_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_CYCLE_NO_ISSUES,
    title: "empty_state_project_cycle_no_issues_title",
    description: "empty_state_project_cycle_no_issues_description",
    path: "/empty-state/cycle-issues/",
    primaryButton: {
      text: "empty_state_project_cycle_no_issues_primary_button",
    },
    secondaryButton: {
      text: "empty_state_project_cycle_no_issues_secondary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_CYCLE_ACTIVE]: {
    key: EmptyStateType.PROJECT_CYCLE_ACTIVE,
    title: "empty_state_project_cycle_active_title",
    description: "empty_state_project_cycle_active_description",
    path: "/empty-state/cycle/active",
  },
  [EmptyStateType.PROJECT_CYCLE_COMPLETED_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_CYCLE_COMPLETED_NO_ISSUES,
    title: "empty_state_project_cycle_completed_no_issues_title",
    description: "empty_state_project_cycle_completed_no_issues_description",
    path: "/empty-state/cycle/completed-no-issues",
  },
  [EmptyStateType.PROJECT_ARCHIVED_NO_CYCLES]: {
    key: EmptyStateType.PROJECT_ARCHIVED_NO_CYCLES,
    title: "empty_state_project_archived_no_cycles_title",
    description: "empty_state_project_archived_no_cycles_description",
    path: "/empty-state/archived/empty-cycles",
  },
  [EmptyStateType.PROJECT_CYCLE_ALL]: {
    key: EmptyStateType.PROJECT_CYCLE_ALL,
    title: "empty_state_project_cycle_all_title",
    description: "empty_state_project_cycle_all_description",
    path: "/empty-state/cycle/active",
  },
  [EmptyStateType.PROJECT_EMPTY_FILTER]: {
    key: EmptyStateType.PROJECT_EMPTY_FILTER,
    title: "empty_state_project_empty_filter_title",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "empty_state_project_empty_filter_secondary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_ARCHIVED_EMPTY_FILTER]: {
    key: EmptyStateType.PROJECT_ARCHIVED_EMPTY_FILTER,
    title: "empty_state_project_archived_empty_filter_title",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "empty_state_project_archived_empty_filter_secondary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_DRAFT_EMPTY_FILTER]: {
    key: EmptyStateType.PROJECT_DRAFT_EMPTY_FILTER,
    title: "empty_state_project_draft_empty_filter_title",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "empty_state_project_draft_empty_filter_secondary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_NO_ISSUES,
    title: "empty_state_project_no_issues_title",
    description: "empty_state_project_no_issues_description",
    path: "/empty-state/onboarding/issues",
    primaryButton: {
      text: "empty_state_project_no_issues_primary_button",
      comicBox: {
        title: "empty_state_project_no_issues_comic_title",
        description: "empty_state_project_no_issues_comic_description",
      },
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_ARCHIVED_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_ARCHIVED_NO_ISSUES,
    title: "empty_state_project_archived_no_issues_title",
    description: "empty_state_project_archived_no_issues_description",
    path: "/empty-state/archived/empty-issues",
    primaryButton: {
      text: "empty_state_project_archived_no_issues_primary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_DRAFT_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_DRAFT_NO_ISSUES,
    title: "empty_state_project_draft_no_issues_title",
    description: "empty_state_project_draft_no_issues_description",
    path: "/empty-state/draft/draft-issues-empty",
  },
  [EmptyStateType.VIEWS_EMPTY_SEARCH]: {
    key: EmptyStateType.VIEWS_EMPTY_SEARCH,
    title: "empty_state_views_empty_search_title",
    description: "empty_state_views_empty_search_description",
    path: "/empty-state/search/views",
  },
  [EmptyStateType.PROJECTS_EMPTY_SEARCH]: {
    key: EmptyStateType.PROJECTS_EMPTY_SEARCH,
    title: "empty_state_projects_empty_search_title",
    description: "empty_state_projects_empty_search_description",
    path: "/empty-state/search/project",
  },
  [EmptyStateType.MEMBERS_EMPTY_SEARCH]: {
    key: EmptyStateType.MEMBERS_EMPTY_SEARCH,
    title: "empty_state_members_empty_search_title",
    description: "empty_state_members_empty_search_description",
    path: "/empty-state/search/member",
  },
  [EmptyStateType.PROJECT_MODULE_ISSUES]: {
    key: EmptyStateType.PROJECT_MODULE_ISSUES,
    title: "empty_state_project_module_issues_title",
    description: "empty_state_project_module_issues_description",
    path: "/empty-state/module-issues/",
    primaryButton: {
      text: "empty_state_project_module_issues_primary_button",
    },
    secondaryButton: {
      text: "empty_state_project_module_issues_secondary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_MODULE]: {
    key: EmptyStateType.PROJECT_MODULE,
    title: "empty_state_project_module_title",
    description: "empty_state_project_module_description",
    path: "/empty-state/onboarding/modules",
    primaryButton: {
      text: "empty_state_project_module_primary_button",
      comicBox: {
        title: "empty_state_project_module_comic_title",
        description: "empty_state_project_module_comic_description",
      },
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_ARCHIVED_NO_MODULES]: {
    key: EmptyStateType.PROJECT_ARCHIVED_NO_MODULES,
    title: "empty_state_project_archived_no_modules_title",
    description: "empty_state_project_archived_no_modules_description",
    path: "/empty-state/archived/empty-modules",
  },
  [EmptyStateType.PROJECT_VIEW]: {
    key: EmptyStateType.PROJECT_VIEW,
    title: "empty_state_project_view_title",
    description: "empty_state_project_view_description",
    path: "/empty-state/onboarding/views",
    primaryButton: {
      text: "empty_state_project_view_primary_button",
      comicBox: {
        title: "empty_state_project_view_comic_title",
        description: "empty_state_project_view_comic_description",
      },
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
  },
  [EmptyStateType.PROJECT_PAGE]: {
    key: EmptyStateType.PROJECT_PAGE,
    title: "empty_state_project_page_title",
    description: "empty_state_project_page_description",
    path: "/empty-state/onboarding/pages",
    primaryButton: {
      text: "empty_state_project_page_primary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_PAGE_PRIVATE]: {
    key: EmptyStateType.PROJECT_PAGE_PRIVATE,
    title: "empty_state_project_page_private_title",
    description: "empty_state_project_page_private_description",
    path: "/empty-state/pages/private",
    primaryButton: {
      text: "empty_state_project_page_private_primary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_PAGE_PUBLIC]: {
    key: EmptyStateType.PROJECT_PAGE_PUBLIC,
    title: "empty_state_project_page_public_title",
    description: "empty_state_project_page_public_description",
    path: "/empty-state/pages/public",
    primaryButton: {
      text: "empty_state_project_page_public_primary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_PAGE_ARCHIVED]: {
    key: EmptyStateType.PROJECT_PAGE_ARCHIVED,
    title: "empty_state_project_page_archived_title",
    description: "empty_state_project_page_archived_description",
    path: "/empty-state/pages/archived",
  },
  [EmptyStateType.WORKSPACE_PAGE]: {
    key: EmptyStateType.WORKSPACE_PAGE,
    title: "empty_state_workspace_page_title",
    description: "empty_state_workspace_page_description",
    path: "/empty-state/onboarding/pages",
    primaryButton: {
      text: "empty_state_workspace_page_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_PAGE_PRIVATE]: {
    key: EmptyStateType.WORKSPACE_PAGE_PRIVATE,
    title: "empty_state_workspace_page_private_title",
    description: "empty_state_workspace_page_private_description",
    path: "/empty-state/pages/private",
    primaryButton: {
      text: "empty_state_workspace_page_private_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_PAGE_PUBLIC]: {
    key: EmptyStateType.WORKSPACE_PAGE_PUBLIC,
    title: "empty_state_workspace_page_public_title",
    description: "empty_state_workspace_page_public_description",
    path: "/empty-state/pages/public",
    primaryButton: {
      text: "empty_state_workspace_page_public_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_PAGE_ARCHIVED]: {
    key: EmptyStateType.WORKSPACE_PAGE_ARCHIVED,
    title: "empty_state_workspace_page_archived_title",
    description: "empty_state_workspace_page_archived_description",
    path: "/empty-state/pages/archived",
  },
  [EmptyStateType.COMMAND_K_SEARCH_EMPTY_STATE]: {
    key: EmptyStateType.COMMAND_K_SEARCH_EMPTY_STATE,
    title: "empty_state_command_k_search_empty_state_title",
    path: "/empty-state/search/search",
  },
  [EmptyStateType.ISSUE_RELATION_SEARCH_EMPTY_STATE]: {
    key: EmptyStateType.ISSUE_RELATION_SEARCH_EMPTY_STATE,
    title: "empty_state_issue_relation_search_empty_state_title",
    path: "/empty-state/search/search",
  },
  [EmptyStateType.ISSUE_RELATION_EMPTY_STATE]: {
    key: EmptyStateType.ISSUE_RELATION_EMPTY_STATE,
    title: "empty_state_issue_relation_empty_state_title",
    path: "/empty-state/search/issues",
  },
  [EmptyStateType.ISSUE_COMMENT_EMPTY_STATE]: {
    key: EmptyStateType.ISSUE_COMMENT_EMPTY_STATE,
    title: "empty_state_issue_comment_empty_state_title",
    description: "empty_state_issue_comment_empty_state_description",
    path: "/empty-state/search/comments",
  },
  [EmptyStateType.NOTIFICATION_DETAIL_EMPTY_STATE]: {
    key: EmptyStateType.INBOX_DETAIL_EMPTY_STATE,
    title: "empty_state_notification_detail_empty_state_title",
    path: "/empty-state/intake/issue-detail",
  },
  [EmptyStateType.NOTIFICATION_ALL_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_ALL_EMPTY_STATE,
    title: "empty_state_notification_all_empty_state_title",
    description: "empty_state_notification_all_empty_state_description",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_MENTIONS_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_MENTIONS_EMPTY_STATE,
    title: "empty_state_notification_mentions_empty_state_title",
    description: "empty_state_notification_mentions_empty_state_description",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_MY_ISSUE_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_MY_ISSUE_EMPTY_STATE,
    title: "empty_state_notification_my_issue_empty_state_title",
    description: "empty_state_notification_my_issue_empty_state_description",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_CREATED_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_CREATED_EMPTY_STATE,
    title: "empty_state_notification_created_empty_state_title",
    description: "empty_state_notification_created_empty_state_description",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_SUBSCRIBED_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_SUBSCRIBED_EMPTY_STATE,
    title: "empty_state_notification_subscribed_empty_state_title",
    description: "empty_state_notification_subscribed_empty_state_description",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_UNREAD_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_UNREAD_EMPTY_STATE,
    title: "empty_state_notification_unread_empty_state_title",
    description: "empty_state_notification_unread_empty_state_description",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_SNOOZED_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_SNOOZED_EMPTY_STATE,
    title: "empty_state_notification_snoozed_empty_state_title",
    description: "empty_state_notification_snoozed_empty_state_description",
    path: "/empty-state/search/snooze",
  },
  [EmptyStateType.NOTIFICATION_ARCHIVED_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_ARCHIVED_EMPTY_STATE,
    title: "empty_state_notification_archived_empty_state_title",
    description: "empty_state_notification_archived_empty_state_description",
    path: "/empty-state/search/archive",
  },
  [EmptyStateType.ACTIVE_CYCLE_PROGRESS_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_PROGRESS_EMPTY_STATE,
    title: "empty_state_active_cycle_progress_empty_state_title",
    path: "/empty-state/active-cycle/progress",
  },
  [EmptyStateType.ACTIVE_CYCLE_CHART_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_CHART_EMPTY_STATE,
    title: "empty_state_active_cycle_chart_empty_state_title",
    path: "/empty-state/active-cycle/chart",
  },
  [EmptyStateType.ACTIVE_CYCLE_PRIORITY_ISSUE_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_PRIORITY_ISSUE_EMPTY_STATE,
    title: "empty_state_active_cycle_priority_issue_empty_state_title",
    path: "/empty-state/active-cycle/priority",
  },
  [EmptyStateType.ACTIVE_CYCLE_ASSIGNEE_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_ASSIGNEE_EMPTY_STATE,
    title: "empty_state_active_cycle_assignee_empty_state_title",
    path: "/empty-state/active-cycle/assignee",
  },
  [EmptyStateType.ACTIVE_CYCLE_LABEL_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_LABEL_EMPTY_STATE,
    title: "empty_state_active_cycle_label_empty_state_title",
    path: "/empty-state/active-cycle/label",
  },
  [EmptyStateType.WORKSPACE_ACTIVE_CYCLES]: {
    key: EmptyStateType.WORKSPACE_ACTIVE_CYCLES,
    title: "empty_state_workspace_active_cycles_title",
    description: "empty_state_workspace_active_cycles_description",
    path: "/empty-state/onboarding/workspace-active-cycles",
  },
  [EmptyStateType.DISABLED_PROJECT_INBOX]: {
    key: EmptyStateType.DISABLED_PROJECT_INBOX,
    title: "empty_state_disabled_project_inbox_title",
    description: "empty_state_disabled_project_inbox_description",
    accessType: "project",
    access: [EUserPermissions.ADMIN],
    path: "/empty-state/disabled-feature/intake",
    primaryButton: {
      text: "empty_state_disabled_project_inbox_primary_button",
    },
  },
  [EmptyStateType.DISABLED_PROJECT_CYCLE]: {
    key: EmptyStateType.DISABLED_PROJECT_CYCLE,
    title: "empty_state_disabled_project_cycle_title",
    description: "empty_state_disabled_project_cycle_description",
    accessType: "project",
    access: [EUserPermissions.ADMIN],
    path: "/empty-state/disabled-feature/cycles",
    primaryButton: {
      text: "empty_state_disabled_project_cycle_primary_button",
    },
  },
  [EmptyStateType.DISABLED_PROJECT_MODULE]: {
    key: EmptyStateType.DISABLED_PROJECT_MODULE,
    title: "empty_state_disabled_project_module_title",
    description: "empty_state_disabled_project_module_description",
    accessType: "project",
    access: [EUserPermissions.ADMIN],
    path: "/empty-state/disabled-feature/modules",
    primaryButton: {
      text: "empty_state_disabled_project_module_primary_button",
    },
  },
  [EmptyStateType.DISABLED_PROJECT_PAGE]: {
    key: EmptyStateType.DISABLED_PROJECT_PAGE,
    title: "empty_state_disabled_project_page_title",
    description: "empty_state_disabled_project_page_description",
    accessType: "project",
    access: [EUserPermissions.ADMIN],
    path: "/empty-state/disabled-feature/pages",
    primaryButton: {
      text: "empty_state_disabled_project_page_primary_button",
    },
  },
  [EmptyStateType.DISABLED_PROJECT_VIEW]: {
    key: EmptyStateType.DISABLED_PROJECT_VIEW,
    title: "empty_state_disabled_project_view_title",
    description: "empty_state_disabled_project_view_description",
    accessType: "project",
    access: [EUserPermissions.ADMIN],
    path: "/empty-state/disabled-feature/views",
    primaryButton: {
      text: "empty_state_disabled_project_view_primary_button",
    },
  },
  [EmptyStateType.INBOX_SIDEBAR_OPEN_TAB]: {
    key: EmptyStateType.INBOX_SIDEBAR_OPEN_TAB,
    title: "empty_state_inbox_sidebar_open_tab_title",
    description: "empty_state_inbox_sidebar_open_tab_description",
    path: "/empty-state/intake/intake-issue",
  },
  [EmptyStateType.INBOX_SIDEBAR_CLOSED_TAB]: {
    key: EmptyStateType.INBOX_SIDEBAR_CLOSED_TAB,
    title: "empty_state_inbox_sidebar_closed_tab_title",
    description: "empty_state_inbox_sidebar_closed_tab_description",
    path: "/empty-state/intake/intake-issue",
  },
  [EmptyStateType.INBOX_SIDEBAR_FILTER_EMPTY_STATE]: {
    key: EmptyStateType.INBOX_SIDEBAR_FILTER_EMPTY_STATE,
    title: "empty_state_inbox_sidebar_filter_empty_state_title",
    description: "empty_state_inbox_sidebar_filter_empty_state_description",
    path: "/empty-state/intake/filter-issue",
  },
  [EmptyStateType.INBOX_DETAIL_EMPTY_STATE]: {
    key: EmptyStateType.INBOX_DETAIL_EMPTY_STATE,
    title: "empty_state_inbox_detail_empty_state_title",
    path: "/empty-state/intake/issue-detail",
  },
  [EmptyStateType.WORKSPACE_DRAFT_ISSUES]: {
    key: EmptyStateType.WORKSPACE_DRAFT_ISSUES,
    title: "empty_state_workspace_draft_issues_title",
    description: "empty_state_workspace_draft_issues_description",
    path: "/empty-state/workspace-draft/issue",
    primaryButton: {
      text: "empty_state_workspace_draft_issues_primary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_NO_EPICS]: {
    key: EmptyStateType.PROJECT_NO_EPICS,
    title: "empty_state_project_no_epics_title",
    description: "empty_state_project_no_epics_description",
    path: "/empty-state/onboarding/issues",
    primaryButton: {
      text: "empty_state_project_no_epics_primary_button",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  // Teams
  [EmptyStateType.TEAM_NO_ISSUES]: {
    key: EmptyStateType.TEAM_NO_ISSUES,
    title: "empty_state_team_no_issues_title",
    description: "empty_state_team_no_issues_description",
    path: "/empty-state/onboarding/issues",
    primaryButton: {
      text: "empty_state_team_no_issues_primary_button",
      comicBox: {
        title: "empty_state_team_no_issues_comic_title",
        description: "empty_state_team_no_issues_comic_description",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.TEAM_EMPTY_FILTER]: {
    key: EmptyStateType.TEAM_EMPTY_FILTER,
    title: "empty_state_team_empty_filter_title",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "empty_state_team_empty_filter_secondary_button",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.TEAM_VIEW]: {
    key: EmptyStateType.TEAM_VIEW,
    title: "empty_state_team_view_title",
    description: "empty_state_team_view_description",
    path: "/empty-state/onboarding/views",
    primaryButton: {
      text: "empty_state_team_view_primary_button",
      comicBox: {
        title: "empty_state_team_view_comic_title",
        description: "empty_state_team_view_comic_description",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.TEAM_PAGE]: {
    key: EmptyStateType.TEAM_PAGE,
    title: "empty_state_team_page_title",
    description: "empty_state_team_page_description",
    path: "/empty-state/onboarding/pages",
  },
} as const;

export const EMPTY_STATE_DETAILS: Record<EmptyStateType, EmptyStateDetails> = emptyStateDetails;
