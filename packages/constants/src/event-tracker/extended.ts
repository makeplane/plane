export const EPIC_TRACKER_EVENTS = {
  create: "epic_created",
  update: "epic_updated",
  delete: "epic_deleted",
  archive: "epic_archived",
  restore: "epic_restored",
  toggle: "epic_toggled",
  enable: "epic_enabled",
  disable: "epic_disabled",
};
export const EPIC_TRACKER_ELEMENTS = {
  QUICK_ACTIONS: "epic_quick_actions",
  TOGGLE_EPICS_BUTTON: "toggle_epics_button",
};

export const EPIC_PROPERTIES_TRACKER_EVENTS = {
  create: "epic_properties_created",
  update: "epic_properties_updated",
  delete: "epic_properties_deleted",
};

export const EPIC_PROPERTIES_TRACKER_ELEMENTS = {
  ACTION_BUTTON: "epic_properties_action_button",
};

export const LICENSE_TRACKER_EVENTS = {
  purchase_modal_opened: "purchase_modal_opened",
  success_modal_opened: "success_modal_opened",
  trial_started: "trial_started",
  upgrade_url_received: "upgrade_url_received",
  upgrade_product_or_price_not_found: "upgrade_product_or_price_not_found",
};

export const LICENSE_TRACKER_ELEMENTS = {
  MODAL_TRIAL_BUTTON: "modal_trial_button",
  BILLING_PAGE_TRIAL_BUTTON: "billing_page_trial_button",
  MODAL_UPGRADE_BUTTON: "modal_upgrade_button",
  BILLING_PAGE_COMPARISON_SECTION_UPGRADE_BUTTON: "billing_page_comparison_section_upgrade_button",
  BILLING_PAGE_PLAN_CARD_UPGRADE_BUTTON: "billing_page_plan_card_upgrade_button",
};

export const PROJECT_GROUPING_TRACKER_EVENTS = {
  ENABLE: "project_grouping_enabled",
  DISABLE: "project_grouping_disabled",
};

export const PROJECT_OVERVIEW_TRACKER_EVENTS = {
  attachment_added: "project_attachment_added",
  attachment_removed: "project_attachment_removed",
};

export const PROJECT_OVERVIEW_TRACKER_ELEMENTS = {
  HEADER_EMOJI_PICKER: "header_emoji_picker",
  ATTACHMENT_DROPZONE: "attachment_dropzone",
  ATTACHMENT_ITEM_CONTEXT_MENU: "attachment_item_context_menu",
};

export const WORK_ITEM_TRACKER_ELEMENTS_EXTENDED = {
  COPY_IN_SAME_PROJECT: "copy_in_same_project",
  COPY_IN_DIFFERENT_PROJECT: "copy_in_different_project",
};

export const TEAMSPACE_TRACKER_EVENTS = {
  ENABLE: "teamspace_enabled",
  DISABLE: "teamspace_disabled",
  CREATE: "teamspace_created",
  UPDATE: "teamspace_updated",
  DELETE: "teamspace_deleted",
  JOIN: "teamspace_joined",
  LEAVE: "teamspace_left",
  MEMBER_ADDED: "teamspace_member_added",
  MEMBER_REMOVED: "teamspace_member_removed",
  LEAD_UPDATED: "teamspace_lead_updated",
  LEAD_REMOVED: "teamspace_lead_removed",
  PROJECTS_UPDATED: "teamspace_projects_updated",
};
export const TEAMSPACE_TRACKER_ELEMENTS = {
  // Teamspace elements
  SETTINGS_PAGE_ENABLE_DISABLE_BUTTON: "teamspace_settings_page_enable_disable_button",
  LIST_HEADER_ADD_BUTTON: "list_header_add_teamspace_button",
  EMPTY_STATE_ADD_BUTTON: "empty_state_add_teamspace_button",
  APP_SIDEBAR_ADD_BUTTON: "app_sidebar_add_teamspace_button",
  ADD_TEAMSPACE_FROM_APP_SIDEBAR: "add_teamspace_from_app_sidebar_button",
  LIST_ITEM_QUICK_ACTIONS: "teamspace_list_item_quick_actions",
  HEADER_QUICK_ACTIONS: "teamspace_header_quick_actions",
  CONTEXT_MENU: "teamspace_context_menu",
  LIST_ITEM_JOIN_BUTTON: "teamspace_list_item_join_button",
  OVERVIEW_JOIN_BUTTON: "teamspace_overview_join_button",
  // Members elements
  OVERVIEW_ADD_MEMBER_BUTTON: "teamspace_overview_add_member_button",
  RIGHT_SIDEBAR_ADD_MEMBER_BUTTON: "teamspace_right_sidebar_add_member_button",
  RIGHT_SIDEBAR_REMOVE_MEMBER_BUTTON: "teamspace_right_sidebar_remove_member_button",
  RIGHT_SIDEBAR_LEAD_DROPDOWN: "teamspace_right_sidebar_lead_dropdown",
  // Project elements
  OVERVIEW_UPDATE_PROJECT_BUTTON: "teamspace_overview_update_project_button",
  EMPTY_STATE_UPDATE_PROJECT_BUTTON: "teamspace_empty_state_update_project_button",
  LIST_ITEM_UPDATE_PROJECT_BUTTON: "teamspace_list_item_update_project_button",
};

export const TEAMSPACE_UPGRADE_TRACKER_ELEMENTS = {
  HIGHER_SUBSCRIPTION_BUTTON: "teamspace_upgrade_higher_subscription_button",
  UPGRADE_BUTTON: "teamspace_upgrade_button",
};

export const TEAMSPACE_ANALYTICS_TRACKER_EVENTS = {
  PROGRESS_FILTER_UPDATED: "teamspace_progress_filter_updated",
  STATISTICS_FILTER_UPDATED: "teamspace_statistics_filter_updated",
  STATISTICS_FILTER_CLEARED: "teamspace_statistics_filter_cleared",
};
export const TEAMSPACE_ANALYTICS_TRACKER_ELEMENTS = {
  PROGRESS_FILTER_DROPDOWN: "teamspace_progress_filter",
  EMPTY_STATE_CLEAR_STATISTICS_FILTERS_BUTTON: "teamspace_empty_state_clear_statistics_filters_button",
  STATISTICS_FILTER_DROPDOWN: "teamspace_statistics_filter_dropdown",
  WORK_ITEM_RELATION_LIST_ITEM: "teamspace_work_item_relation_list_item",
};

export const TEAMSPACE_UPDATES_TRACKER_EVENTS = {
  COMMENT_CREATED: "teamspace_comment_created",
  COMMENT_UPDATED: "teamspace_comment_updated",
  COMMENT_DELETED: "teamspace_comment_deleted",
  COMMENT_ASSET_UPLOADED: "teamspace_comment_asset_uploaded",
  COMMENT_REACTION_ADDED: "teamspace_comment_reaction_added",
  COMMENT_REACTION_REMOVED: "teamspace_comment_reaction_removed",
};
export const TEAMSPACE_UPDATES_TRACKER_ELEMENTS = {
  SIDEBAR_ACTIVITY_SORT_BUTTON: "teamspace_sidebar_activity_sort_button",
  SIDEBAR_COMMENTS_SORT_BUTTON: "teamspace_sidebar_comments_sort_button",
  SIDEBAR_COMMENT_SECTION: "teamspace_sidebar_comment_section",
};

export const TEAMSPACE_WORK_ITEM_TRACKER_EVENTS = {
  LAYOUT_UPDATE: "teamspace_work_item_layout_updated",
  DISPLAY_FILTER_UPDATE: "teamspace_work_item_display_filter_updated",
  DISPLAY_PROPERTY_UPDATE: "teamspace_work_item_display_property_updated",
  EMPTY_STATE_CLEAR_FILTERS: "teamspace_empty_state_clear_filters",
};
export const TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS = {
  HEADER_ADD_WORK_ITEM_BUTTON: "teamspace_header_add_work_item_button",
  EMPTY_STATE_ADD_WORK_ITEM_BUTTON: "teamspace_empty_state_add_work_item_button",
  HEADER_UPDATE_LAYOUT_BUTTON: "teamspace_header_update_work_item_layout_button",
  HEADER_UPDATE_DISPLAY_FILTER_BUTTON: "teamspace_header_update_work_item_display_filter_button",
  HEADER_UPDATE_DISPLAY_PROPERTY_BUTTON: "teamspace_header_update_work_item_display_property_button",
  EMPTY_STATE_CLEAR_FILTERS_BUTTON: "teamspace_empty_state_clear_filters_button",
};

export const TEAMSPACE_PAGE_TRACKER_EVENTS = {
  PAGE_CREATE: "teamspace_page_created",
};

export const WORKSPACE_PAGE_TRACKER_EVENTS = {
  create: "workspace_page_created",
  update: "workspace_page_updated",
  delete: "workspace_page_deleted",
  archive: "workspace_page_archived",
  restore: "workspace_page_restored",
  lock: "workspace_page_locked",
  unlock: "workspace_page_unlocked",
  access_update: "workspace_page_access_updated",
  duplicate: "workspace_page_duplicated",
  favorite: "workspace_page_favorited",
  unfavorite: "workspace_page_unfavorited",
  nested_page_create: "workspace_nested_page_created",
  nested_page_update: "workspace_nested_page_updated",
  nested_page_delete: "workspace_nested_page_deleted",
  nested_page_move: "workspace_nested_page_moved",
  nested_page_duplicate: "workspace_nested_page_duplicated",
  nested_page_archive: "workspace_nested_page_archived",
  nested_page_restore: "workspace_nested_page_restored",
  nested_page_lock: "workspace_nested_page_locked",
  nested_page_unlock: "workspace_nested_page_unlocked",
  nested_page_access_update: "workspace_nested_page_access_updated",
  nested_page_favorite: "workspace_nested_page_favorited",
  nested_page_unfavorite: "workspace_nested_page_unfavorited",
};

export const TEAMSPACE_PAGE_TRACKER_ELEMENTS = {
  HEADER_CREATE_PAGE_BUTTON: "teamspace_header_create_page_button",
  EMPTY_STATE_CREATE_PAGE_BUTTON: "teamspace_empty_state_create_page_button",
};

export const TEAMSPACE_VIEW_TRACKER_EVENTS = {
  VIEW_CREATE: "teamspace_view_created",
  VIEW_UPDATE: "teamspace_view_updated",
  VIEW_DELETE: "teamspace_view_deleted",
  VIEW_PUBLISH: "teamspace_view_published",
  VIEW_PUBLISH_SETTINGS_UPDATE: "teamspace_view_publish_settings_updated",
  VIEW_UNPUBLISH: "teamspace_view_unpublished",
  VIEW_FAVORITE: "teamspace_view_favorited",
  VIEW_UNFAVORITE: "teamspace_view_unfavorited",
  EMPTY_STATE_CLEAR_WORK_ITEM_FILTERS: "teamspace_empty_state_clear_work_item_filters",
};
export const TEAMSPACE_VIEW_TRACKER_ELEMENTS = {
  HEADER_CREATE_VIEW_BUTTON: "teamspace_header_create_view_button",
  HEADER_SAVE_VIEW_BUTTON: "teamspace_header_save_view_button",
  EMPTY_STATE_ADD_WORK_ITEM_BUTTON: "teamspace_empty_state_add_work_item_button",
  LIST_ITEM_QUICK_ACTIONS: "teamspace_view_list_item_quick_actions",
  LIST_ITEM_FAVORITE_BUTTON: "teamspace_view_list_item_favorite_button",
  CONTEXT_MENU: "teamspace_view_context_menu",
};

export const INTEGRATION_TRACKER_ELEMENTS = {
  INTEGRATIONS_MAPPING_ENTITY_ITEM_BUTTON: "integrations_mapping_entity_item_button",
};

export const SLACK_INTEGRATION_TRACKER_EVENTS = {
  disconnect_app: "slack_app_disconnected",
  disconnect_user: "slack_user_disconnected",
  create_project_connection: "slack_project_connection_created",
  update_project_connection: "slack_project_connection_updated",
  delete_project_connection: "slack_project_connection_deleted",
  connect_app: "slack_app_connected",
  connect_user: "slack_user_connected",
};
export const SLACK_INTEGRATION_TRACKER_ELEMENTS = {
  CONNECT_DISCONNECT_PERSONAL_ACCOUNT_CONTEXT_MENU: "slack_connect_disconnect_personal_account_context_menu",
  CONNECT_DISCONNECT_WORKSPACE_CONTEXT_MENU: "slack_connect_disconnect_workspace_context_menu",
  CONNECT_DISCONNECT_APP_BUTTON: "slack_connect_disconnect_app_button",
  CHANNEL_MAPPING_HEADER_ADD_BUTTON: "slack_channel_mapping_header_add_button",
};

export const GITHUB_INTEGRATION_TRACKER_EVENTS = {
  disconnect_user: "github_user_disconnected",
  connect_user: "github_user_connected",
  disconnect_organization: "github_organization_disconnected",
  connect_organization: "github_organization_connected",
  create_entity_connection: "github_entity_connection_created",
  update_entity_connection: "github_entity_connection_updated",
  delete_entity_connection: "github_entity_connection_deleted",
};
export const GITHUB_INTEGRATION_TRACKER_ELEMENTS = {
  CONNECT_DISCONNECT_ORGANIZATION_BUTTON: "github_connect_disconnect_organization_button",
  CONNECT_DISCONNECT_PERSONAL_ACCOUNT_BUTTON: "github_connect_disconnect_personal_account_button",
  REPOSITORY_MAPPING_HEADER_ADD_BUTTON: "github_repository_mapping_header_add_button",
};

export const GITLAB_INTEGRATION_TRACKER_EVENTS = {
  connect_organization: "gitlab_organization_connected",
  disconnect_organization: "gitlab_organization_disconnected",
  create_entity_connection: "gitlab_entity_connection_created",
  update_entity_connection: "gitlab_entity_connection_updated",
  delete_entity_connection: "gitlab_entity_connection_deleted",
  create_project_entity_connection: "gitlab_project_entity_connection_created",
  add_gitlab_project: "gitlab_project_added",
  add_plane_project: "plane_project_added",
};
export const GITLAB_INTEGRATION_TRACKER_ELEMENTS = {
  CONNECT_DISCONNECT_ORGANIZATION_BUTTON: "gitlab_connect_disconnect_organization_button",
  REPOSITORY_MAPPING_HEADER_ADD_BUTTON: "gitlab_repository_mapping_header_add_button",
  GITLAB_ADD_PROJECT_BUTTON: "gitlab_add_project_button",
  PLANE_ADD_PROJECT_BUTTON: "plane_add_project_button",
  GITLAB_MAPPING_ENTITY_ITEM_BUTTON: "gitlab_mapping_entity_item_button",
  PLANE_MAPPING_ENTITY_ITEM_BUTTON: "plane_mapping_entity_item_button",
};
export const USER_CONNECTIONS_VIEW_TRACKER_ELEMENTS = {
  CONNECTION_CONNECT_DISCONNECT_BUTTON: "connections_view_connection_connect_disconnect_button",
};

export const WORKSPACE_WORKLOG_TRACKER_ELEMENTS = {
  HEADER_DOWNLOAD_CONTEXT_MENU: "workspace_worklog_header_download_context_menu",
  TABLE_DOWNLOAD_BUTTON: "workspace_worklog_table_download_button",
};

export const WORKSPACE_WORKLOG_TRACKER_EVENTS = {
  CREATE_WORKLOG_DOWNLOAD: "workspace_worklog_created_worklog_download",
  DOWNLOAD_WORKLOG: "workspace_worklog_worklog_downloaded",
};

export const INITIATIVES_TRACKER_ELEMENTS = {
  SETTINGS_PAGE_ENABLE_DISABLE_BUTTON: "initiatives_settings_page_enable_disable_button",
};
export const INITIATIVE_TRACKER_EVENTS = {
  TOGGLE: "initiatives_toggled",
};

export const PLANE_INTELLIGENCE_TRACKER_EVENTS = {
  TOGGLE: "plane_intelligence_toggled",
};
export const PLANE_INTELLIGENCE_TRACKER_ELEMENTS = {
  SETTINGS_PAGE_TOGGLE_BUTTON: "plane_intelligence_settings_page_toggle_button",
  HIGHER_SUBSCRIPTION_BUTTON: "plane_intelligence_higher_subscription_button",
  UPGRADE_BUTTON: "plane_intelligence_upgrade_button",
};

export const IMPORTER_TRACKER_ELEMENTS = {
  IMPORTER_DASHBOARD_RE_RUN_BUTTON: "importer_dashboard_re_run_button",
  IMPORTER_DASHBOARD_CANCEL_BUTTON: "importer_dashboard_cancel_button",
  IMPORTER_DASHBOARD_DEACTIVATE_BUTTON: "importer_dashboard_deactivate_button",
  IMPORTER_DASHBOARD_REFRESH_BUTTON: "importer_dashboard_refresh_button",
  IMPORTER_DASHBOARD_IMPORT_BUTTON: "importer_dashboard_import_button",
  IMPORTER_CONFIRGURE_NEXT_BUTTON: "importer_configure_next_button",
  IMPORTER_CONFIRGURE_BACK_BUTTON: "importer_configure_back_button",
};

export const IMPORTER_TRACKER_EVENTS = {
  RE_RUN: "importer_re_run_job",
  CANCEL: "importer_cancel_job",
  REFRESH: "importer_refresh_jobs",
  DEACTIVATE: "importer_auth_deactivated",
  CREATE_ASANA_JOB: "importer_asana_job_created",
  START_ASANA_JOB: "importer_asana_job_started",
  CREATE_CLICKUP_JOB: "importer_clickup_job_created",
  START_CLICKUP_JOB: "importer_clickup_job_started",
  CREATE_CONFLUENCE_JOB: "importer_confluence_job_created",
  START_CONFLUENCE_JOB: "importer_confluence_job_started",
  CREATE_JIRA_JOB: "importer_jira_job_created",
  START_JIRA_JOB: "importer_jira_job_started",
  CREATE_JIRA_SERVER_JOB: "importer_jira_server_job_created",
  START_JIRA_SERVER_JOB: "importer_jira_server_job_started",
  CREATE_LINEAR_JOB: "importer_linear_job_created",
  START_LINEAR_JOB: "importer_linear_job_started",
  CREATE_START_NOTION_JOB: "importer_notion_job_created_started",
  UPLOAD_ZIP_FILE: "importer_upload_zip_file",
  CREATE_FLATFILE_JOB: "importer_flatfile_job_created",
  START_FLATFILE_JOB: "importer_flatfile_job_started",
};

export const WORKFLOW_TRACKER_EVENTS = {
  TRANSITION_CREATED: "workflow_transition_created",
  TRANSITION_DELETED: "workflow_transition_deleted",
  WORKFLOW_ENABLED_DISABLED: "workflow_enabled_disabled",
  WORKFLOW_RESET: "workflow_reset",
  APPROVERS_UPDATED: "workflow_approvers_updated",
  TOGGLE_WORK_ITEM_CREATION: "workflow_toggle_work_item_creation",
  STATE_UPDATED: "workflow_state_updated",
};

export const WORKFLOW_TRACKER_ELEMENTS = {
  WORK_FLOW_ENABLE_DISABLE_BUTTON: "workflow_enable_disable_button",
  WORKFLOW_RESET_BUTTON: "workflow_reset_button",
  CREATE_TRANSITION_BUTTON: "workflow_create_transition_button",
  DELETE_TRANSITION_BUTTON: "workflow_delete_transition_button",
  ADD_NEW_WORK_ITEMS_TOGGLE_BUTTON: "workflow_add_new_work_items_toggle_button",
};

// Project Template Tracker Start
export const PROJECT_TEMPLATE_TRACKER_EVENTS = {
  CREATE: "project_template_created",
  UPDATE: "project_template_updated",
  DELETE: "project_template_deleted",
  PUBLISH: "project_template_published",
  UNPUBLISH: "project_template_unpublished",
};
export const PROJECT_TEMPLATE_TRACKER_ELEMENTS = {
  SETTINGS_PAGE_CREATE_BUTTON: "project_template_settings_page_create_button",
  EMPTY_STATE_CREATE_BUTTON: "project_template_empty_state_create_button",
  CREATE_PROJECT_MODAL_CREATE_BUTTON: "project_template_create_project_modal_create_button",
  CREATE_PROJECT_MODAL_TEMPLATE_OPTION: "project_template_create_project_modal_template_option",
  LIST_ITEM_EDIT_BUTTON: "project_template_list_item_edit_button",
  LIST_ITEM_PUBLISH_BUTTON: "project_template_list_item_publish_button",
  LIST_ITEM_UNPUBLISH_BUTTON: "project_template_list_item_unpublish_button",
  LIST_ITEM_DELETE_BUTTON: "project_template_list_item_delete_button",
  LIST_ITEM_USE_TEMPLATE_BUTTON: "project_template_list_item_use_template_button",
  CREATE_UPDATE_FORM_CANCEL_BUTTON: "project_template_create_update_form_cancel_button",
  CREATE_UPDATE_FORM_SUBMIT_BUTTON: "project_template_create_update_form_submit_button",
  PUBLISH_FORM_CANCEL_BUTTON: "project_template_publish_form_cancel_button",
  PUBLISH_FORM_SUBMIT_BUTTON: "project_template_publish_form_submit_button",
};

// Project Template Tracker End

// Workitem Template Tracker Start

export const WORKITEM_TEMPLATE_TRACKER_EVENTS = {
  CREATE: "workitem_template_created",
  UPDATE: "workitem_template_updated",
  DELETE: "workitem_template_deleted",
  PUBLISH: "workitem_template_published",
  UNPUBLISH: "workitem_template_unpublished",
};
export const WORKITEM_TEMPLATE_TRACKER_ELEMENTS = {
  WORKSPACE_SETTINGS_PAGE_CREATE_BUTTON: "workitem_template_workspace_settings_page_create_button",
  PROJECT_SETTINGS_PAGE_CREATE_BUTTON: "workitem_template_project_settings_page_create_button",
  WORKSPACE_EMPTY_STATE_CREATE_BUTTON: "workitem_template_workspace_empty_state_create_button",
  PROJECT_EMPTY_STATE_CREATE_BUTTON: "workitem_template_project_empty_state_create_button",
  CREATE_WORKITEM_MODAL_CREATE_BUTTON: "workitem_template_create_workitem_modal_create_button",
  CREATE_WORKITEM_MODAL_TEMPLATE_OPTION: "workitem_template_create_workitem_modal_template_option",
  LIST_ITEM_EDIT_BUTTON: "workitem_template_list_item_edit_button",
  LIST_ITEM_PUBLISH_BUTTON: "workitem_template_list_item_publish_button",
  LIST_ITEM_UNPUBLISH_BUTTON: "workitem_template_list_item_unpublish_button",
  LIST_ITEM_DELETE_BUTTON: "workitem_template_list_item_delete_button",
  LIST_ITEM_USE_TEMPLATE_BUTTON: "workitem_template_list_item_use_template_button",
  WORKSPACE_CREATE_UPDATE_FORM_CANCEL_BUTTON: "workitem_template_workspace_create_update_form_cancel_button",
  PROJECT_CREATE_UPDATE_FORM_CANCEL_BUTTON: "workitem_template_project_create_update_form_cancel_button",
  WORKSPACE_CREATE_UPDATE_FORM_SUBMIT_BUTTON: "workitem_template_workspace_create_update_form_submit_button",
  PROJECT_CREATE_UPDATE_FORM_SUBMIT_BUTTON: "workitem_template_project_create_update_form_submit_button",
};

// Workitem Template Tracker End

// Page Template Tracker Start

export const PAGE_TEMPLATE_TRACKER_EVENTS = {
  CREATE: "page_template_created",
  UPDATE: "page_template_updated",
  DELETE: "page_template_deleted",
  PUBLISH: "page_template_published",
  UNPUBLISH: "page_template_unpublished",
};
export const PAGE_TEMPLATE_TRACKER_ELEMENTS = {
  WORKSPACE_SETTINGS_PAGE_CREATE_BUTTON: "page_template_workspace_settings_page_create_button",
  PROJECT_SETTINGS_PAGE_CREATE_BUTTON: "page_template_project_settings_page_create_button",
  WORKSPACE_EMPTY_STATE_CREATE_BUTTON: "page_template_workspace_empty_state_create_button",
  PROJECT_EMPTY_STATE_CREATE_BUTTON: "page_template_project_empty_state_create_button",
  EDITOR_TEMPLATE_PICKER_BUTTON: "page_template_editor_template_picker_button",
  LIST_ITEM_EDIT_BUTTON: "page_template_list_item_edit_button",
  LIST_ITEM_PUBLISH_BUTTON: "page_template_list_item_publish_button",
  LIST_ITEM_UNPUBLISH_BUTTON: "page_template_list_item_unpublish_button",
  LIST_ITEM_DELETE_BUTTON: "page_template_list_item_delete_button",
  LIST_ITEM_USE_TEMPLATE_BUTTON: "page_template_list_item_use_template_button",
  WORKSPACE_CREATE_UPDATE_FORM_CANCEL_BUTTON: "page_template_workspace_create_update_form_cancel_button",
  PROJECT_CREATE_UPDATE_FORM_CANCEL_BUTTON: "page_template_project_create_update_form_cancel_button",
  WORKSPACE_CREATE_UPDATE_FORM_SUBMIT_BUTTON: "page_template_workspace_create_update_form_submit_button",
  PROJECT_CREATE_UPDATE_FORM_SUBMIT_BUTTON: "page_template_project_create_update_form_submit_button",
};

// Page Template Tracker End
