export const EPIC_TRACKER_EVENTS = {
  create: "epic_created",
  update: "epic_updated",
  delete: "epic_deleted",
  archive: "epic_archived",
  restore: "epic_restored",
};
export const EPIC_TRACKER_ELEMENTS = {
  QUICK_ACTIONS: "epic_quick_actions",
};

export const LICENSE_TRACKER_EVENTS = {
  purchase_modal_opened: "purchase_modal_opened",
  success_modal_opened: "success_modal_opened",
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
  EMPTY_STATE_ADD_WORK_ITEM_BUTTON: "teamspace_empty_state_add_work_item_button",
  LIST_ITEM_QUICK_ACTIONS: "teamspace_view_list_item_quick_actions",
  LIST_ITEM_FAVORITE_BUTTON: "teamspace_view_list_item_favorite_button",
  CONTEXT_MENU: "teamspace_view_context_menu",
};
