import type { EProductSubscriptionEnum } from "@plane/types";

/**
 * ===========================================================================
 * Event Groups
 * ===========================================================================
 */
export const GROUP_WORKSPACE_TRACKER_EVENT = "workspace_metrics";
export const GITHUB_REDIRECTED_TRACKER_EVENT = "github_redirected";
export const HEADER_GITHUB_ICON = "header_github_icon";

/**
 * ===========================================================================
 * Command palette tracker
 * ===========================================================================
 */
export const COMMAND_PALETTE_TRACKER_ELEMENTS = {
  COMMAND_PALETTE_SHORTCUT_KEY: "command_palette_shortcut_key",
};

/**
 * ===========================================================================
 * Workspace Events and Elements
 * ===========================================================================
 */
export const WORKSPACE_TRACKER_EVENTS = {
  create: "workspace_created",
  update: "workspace_updated",
  delete: "workspace_deleted",
};

export const WORKSPACE_TRACKER_ELEMENTS = {
  DELETE_WORKSPACE_BUTTON: "delete_workspace_button",
  ONBOARDING_CREATE_WORKSPACE_BUTTON: "onboarding_create_workspace_button",
  CREATE_WORKSPACE_BUTTON: "create_workspace_button",
  UPDATE_WORKSPACE_BUTTON: "update_workspace_button",
};

/**
 * ===========================================================================
 * Project Events and Elements
 * ===========================================================================
 */
export const PROJECT_TRACKER_EVENTS = {
  create: "project_created",
  update: "project_updated",
  delete: "project_deleted",
  feature_toggled: "feature_toggled",
};

export const PROJECT_TRACKER_ELEMENTS = {
  EXTENDED_SIDEBAR_ADD_BUTTON: "extended_sidebar_add_project_button",
  SIDEBAR_CREATE_PROJECT_BUTTON: "sidebar_create_project_button",
  SIDEBAR_CREATE_PROJECT_TOOLTIP: "sidebar_create_project_tooltip",
  COMMAND_PALETTE_CREATE_BUTTON: "command_palette_create_project_button",
  COMMAND_PALETTE_SHORTCUT_CREATE_BUTTON: "command_palette_shortcut_create_project_button",
  EMPTY_STATE_CREATE_PROJECT_BUTTON: "empty_state_create_project_button",
  CREATE_HEADER_BUTTON: "create_project_header_button",
  CREATE_FIRST_PROJECT_BUTTON: "create_first_project_button",
  DELETE_PROJECT_BUTTON: "delete_project_button",
  UPDATE_PROJECT_BUTTON: "update_project_button",
  CREATE_PROJECT_JIRA_IMPORT_DETAIL_PAGE: "create_project_jira_import_detail_page",
  TOGGLE_FEATURE: "toggle_project_feature",
};

/**
 * ===========================================================================
 * Cycle Events and Elements
 * ===========================================================================
 */
export const CYCLE_TRACKER_EVENTS = {
  create: "cycle_created",
  update: "cycle_updated",
  delete: "cycle_deleted",
  favorite: "cycle_favorited",
  unfavorite: "cycle_unfavorited",
  archive: "cycle_archived",
  restore: "cycle_restored",
};

export const CYCLE_TRACKER_ELEMENTS = {
  RIGHT_HEADER_ADD_BUTTON: "right_header_add_cycle_button",
  EMPTY_STATE_ADD_BUTTON: "empty_state_add_cycle_button",
  COMMAND_PALETTE_ADD_ITEM: "command_palette_add_cycle_item",
  RIGHT_SIDEBAR: "cycle_right_sidebar",
  QUICK_ACTIONS: "cycle_quick_actions",
  CONTEXT_MENU: "cycle_context_menu",
  LIST_ITEM: "cycle_list_item",
} as const;

/**
 * ===========================================================================
 * Module Events and Elements
 * ===========================================================================
 */
export const MODULE_TRACKER_EVENTS = {
  create: "module_created",
  update: "module_updated",
  delete: "module_deleted",
  favorite: "module_favorited",
  unfavorite: "module_unfavorited",
  archive: "module_archived",
  restore: "module_restored",
  link: {
    create: "module_link_created",
    update: "module_link_updated",
    delete: "module_link_deleted",
  },
};

export const MODULE_TRACKER_ELEMENTS = {
  RIGHT_HEADER_ADD_BUTTON: "right_header_add_module_button",
  EMPTY_STATE_ADD_BUTTON: "empty_state_add_module_button",
  COMMAND_PALETTE_ADD_ITEM: "command_palette_add_module_item",
  RIGHT_SIDEBAR: "module_right_sidebar",
  QUICK_ACTIONS: "module_quick_actions",
  CONTEXT_MENU: "module_context_menu",
  LIST_ITEM: "module_list_item",
  CARD_ITEM: "module_card_item",
} as const;

/**
 * ===========================================================================
 * Work Item Events and Elements
 * ===========================================================================
 */
export const WORK_ITEM_TRACKER_EVENTS = {
  create: "work_item_created",
  add_existing: "work_item_add_existing",
  update: "work_item_updated",
  delete: "work_item_deleted",
  archive: "work_item_archived",
  restore: "work_item_restored",
  attachment: {
    add: "work_item_attachment_added",
    remove: "work_item_attachment_removed",
  },
  sub_issue: {
    update: "sub_issue_updated",
    remove: "sub_issue_removed",
    delete: "sub_issue_deleted",
    create: "sub_issue_created",
    add_existing: "sub_issue_add_existing",
  },
  draft: {
    create: "draft_work_item_created",
  },
};
export const WORK_ITEM_TRACKER_ELEMENTS = {
  HEADER_ADD_BUTTON: {
    WORK_ITEMS: "work_items_header_add_work_item_button",
    PROJECT_VIEW: "project_view_header_add_work_item_button",
    CYCLE: "cycle_header_add_work_item_button",
    MODULE: "module_header_add_work_item_button",
  },
  COMMAND_PALETTE_ADD_BUTTON: "command_palette_add_work_item_button",
  EMPTY_STATE_ADD_BUTTON: {
    WORK_ITEMS: "work_items_empty_state_add_work_item_button",
    PROJECT_VIEW: "project_view_empty_state_add_work_item_button",
    CYCLE: "cycle_empty_state_add_work_item_button",
    MODULE: "module_empty_state_add_work_item_button",
    GLOBAL_VIEW: "global_view_empty_state_add_work_item_button",
  },
  QUICK_ACTIONS: {
    WORK_ITEMS: "work_items_quick_actions",
    PROJECT_VIEW: "project_view_work_items_quick_actions",
    CYCLE: "cycle_work_items_quick_actions",
    MODULE: "module_work_items_quick_actions",
    GLOBAL_VIEW: "global_view_work_items_quick_actions",
    ARCHIVED: "archived_work_items_quick_actions",
    DRAFT: "draft_work_items_quick_actions",
  },
  CONTEXT_MENU: {
    WORK_ITEMS: "work_items_context_menu",
    PROJECT_VIEW: "project_view_context_menu",
    CYCLE: "cycle_context_menu",
    MODULE: "module_context_menu",
    GLOBAL_VIEW: "global_view_context_menu",
    ARCHIVED: "archived_context_menu",
    DRAFT: "draft_context_menu",
  },
} as const;

/**
 * ===========================================================================
 * State Events and Elements
 * ===========================================================================
 */
export const STATE_TRACKER_EVENTS = {
  create: "state_created",
  update: "state_updated",
  delete: "state_deleted",
};
export const STATE_TRACKER_ELEMENTS = {
  STATE_GROUP_ADD_BUTTON: "state_group_add_button",
  STATE_LIST_DELETE_BUTTON: "state_list_delete_button",
  STATE_LIST_EDIT_BUTTON: "state_list_edit_button",
};

/**
 * ===========================================================================
 * Project Page Events and Elements
 * ===========================================================================
 */
export const PROJECT_PAGE_TRACKER_EVENTS = {
  create: "project_page_created",
  update: "project_page_updated",
  delete: "project_page_deleted",
  archive: "project_page_archived",
  restore: "project_page_restored",
  lock: "project_page_locked",
  unlock: "project_page_unlocked",
  access_update: "project_page_access_updated",
  duplicate: "project_page_duplicated",
  favorite: "project_page_favorited",
  unfavorite: "project_page_unfavorited",
  move: "project_page_moved",
};
export const PROJECT_PAGE_TRACKER_ELEMENTS = {
  COMMAND_PALETTE_SHORTCUT_CREATE_BUTTON: "command_palette_shortcut_create_page_button",
  EMPTY_STATE_CREATE_BUTTON: "empty_state_create_page_button",
  COMMAND_PALETTE_CREATE_BUTTON: "command_palette_create_page_button",
  CONTEXT_MENU: "page_context_menu",
  QUICK_ACTIONS: "page_quick_actions",
  LIST_ITEM: "page_list_item",
  FAVORITE_BUTTON: "page_favorite_button",
  ARCHIVE_BUTTON: "page_archive_button",
  LOCK_BUTTON: "page_lock_button",
  ACCESS_TOGGLE: "page_access_toggle",
  DUPLICATE_BUTTON: "page_duplicate_button",
} as const;

/**
 * ===========================================================================
 * Member Events and Elements
 * ===========================================================================
 */
export const MEMBER_TRACKER_EVENTS = {
  invite: "member_invited",
  accept: "member_accepted",
  project: {
    add: "project_member_added",
    leave: "project_member_left",
  },
  workspace: {
    leave: "workspace_member_left",
  },
};
export const MEMBER_TRACKER_ELEMENTS = {
  HEADER_ADD_BUTTON: "header_add_member_button",
  ACCEPT_INVITATION_BUTTON: "accept_invitation_button",
  ONBOARDING_JOIN_WORKSPACE: "workspace_join_continue_to_workspace_button",
  ONBOARDING_INVITE_MEMBER: "invite_member_continue_button",
  SIDEBAR_PROJECT_QUICK_ACTIONS: "sidebar_project_quick_actions",
  PROJECT_MEMBER_TABLE_CONTEXT_MENU: "project_member_table_context_menu",
  WORKSPACE_MEMBER_TABLE_CONTEXT_MENU: "workspace_member_table_context_menu",
  WORKSPACE_INVITATIONS_LIST_CONTEXT_MENU: "workspace_invitations_list_context_menu",
} as const;

/**
 * ===========================================================================
 * Auth Events and Elements
 * ===========================================================================
 */
export const AUTH_TRACKER_EVENTS = {
  code_verify: "code_verified",
  sign_up_with_password: "sign_up_with_password",
  sign_in_with_password: "sign_in_with_password",
  forgot_password: "forgot_password_clicked",
  new_code_requested: "new_code_requested",
  password_created: "password_created",
};

export const AUTH_TRACKER_ELEMENTS = {
  NAVIGATE_TO_SIGN_UP: "navigate_to_sign_up",
  FORGOT_PASSWORD_FROM_SIGNIN: "forgot_password_from_signin",
  SIGNUP_FROM_FORGOT_PASSWORD: "signup_from_forgot_password",
  SIGN_IN_FROM_SIGNUP: "sign_in_from_signup",
  SIGN_IN_WITH_UNIQUE_CODE: "sign_in_with_unique_code",
  REQUEST_NEW_CODE: "request_new_code",
  VERIFY_CODE: "verify_code",
  SET_PASSWORD_FORM: "set_password_form",
};

/**
 * ===========================================================================
 * Global View Events and Elements
 * ===========================================================================
 */
export const GLOBAL_VIEW_TRACKER_EVENTS = {
  create: "global_view_created",
  update: "global_view_updated",
  delete: "global_view_deleted",
  open: "global_view_opened",
};

export const GLOBAL_VIEW_TRACKER_ELEMENTS = {
  RIGHT_HEADER_ADD_BUTTON: "global_view_right_header_add_button",
  HEADER_SAVE_VIEW_BUTTON: "global_view_header_save_view_button",
  QUICK_ACTIONS: "global_view_quick_actions",
  LIST_ITEM: "global_view_list_item",
};

/**
 * ===========================================================================
 * Project View Events and Elements
 * ===========================================================================
 */
export const PROJECT_VIEW_TRACKER_EVENTS = {
  create: "project_view_created",
  update: "project_view_updated",
  delete: "project_view_deleted",
};

export const PROJECT_VIEW_TRACKER_ELEMENTS = {
  RIGHT_HEADER_ADD_BUTTON: "project_view_right_header_add_button",
  COMMAND_PALETTE_ADD_ITEM: "command_palette_add_project_view_item",
  EMPTY_STATE_CREATE_BUTTON: "project_view_empty_state_create_button",
  HEADER_SAVE_VIEW_BUTTON: "project_view_header_save_view_button",
  PROJECT_HEADER_SAVE_AS_VIEW_BUTTON: "project_view_header_save_as_view_button",
  CYCLE_HEADER_SAVE_AS_VIEW_BUTTON: "cycle_header_save_as_view_button",
  MODULE_HEADER_SAVE_AS_VIEW_BUTTON: "module_header_save_as_view_button",
  QUICK_ACTIONS: "project_view_quick_actions",
  LIST_ITEM_CONTEXT_MENU: "project_view_list_item_context_menu",
};

/**
 * ===========================================================================
 * Product Tour Events and Elements
 * ===========================================================================
 */
export const PRODUCT_TOUR_TRACKER_EVENTS = {
  complete: "product_tour_completed",
};

export const PRODUCT_TOUR_TRACKER_ELEMENTS = {
  START_BUTTON: "product_tour_start_button",
  SKIP_BUTTON: "product_tour_skip_button",
  CREATE_PROJECT_BUTTON: "product_tour_create_project_button",
};

/**
 * ===========================================================================
 * Notification Events and Elements
 * ===========================================================================
 */
export const NOTIFICATION_TRACKER_EVENTS = {
  archive: "notification_archived",
  unarchive: "notification_unarchived",
  mark_read: "notification_marked_read",
  mark_unread: "notification_marked_unread",
  all_marked_read: "all_notifications_marked_read",
};

export const NOTIFICATION_TRACKER_ELEMENTS = {
  MARK_ALL_AS_READ_BUTTON: "mark_all_as_read_button",
  ARCHIVE_UNARCHIVE_BUTTON: "archive_unarchive_button",
  MARK_READ_UNREAD_BUTTON: "mark_read_unread_button",
};

/**
 * ===========================================================================
 * User Events
 * ===========================================================================
 */
export const USER_TRACKER_EVENTS = {
  add_details: "user_details_added",
  onboarding_complete: "user_onboarding_completed",
};

export const USER_TRACKER_ELEMENTS = {
  PRODUCT_CHANGELOG_MODAL: "product_changelog_modal",
  CHANGELOG_REDIRECTED: "changelog_redirected",
};

/**
 * ===========================================================================
 * Onboarding Events and Elements
 * ===========================================================================
 */
export const ONBOARDING_TRACKER_ELEMENTS = {
  PROFILE_SETUP_FORM: "onboarding_profile_setup_form",
  PASSWORD_CREATION_SELECTED: "onboarding_password_creation_selected",
  PASSWORD_CREATION_SKIPPED: "onboarding_password_creation_skipped",
};

/**
 * ===========================================================================
 * Sidebar Events
 * ===========================================================================
 */
export const SIDEBAR_TRACKER_ELEMENTS = {
  USER_MENU_ITEM: "sidenav_user_menu_item",
  CREATE_WORK_ITEM_BUTTON: "sidebar_create_work_item_button",
};

/**
 * ===========================================================================
 * Project Settings Events and Elements
 * ===========================================================================
 */
export const PROJECT_SETTINGS_TRACKER_ELEMENTS = {
  LABELS_EMPTY_STATE_CREATE_BUTTON: "labels_empty_state_create_button",
  LABELS_HEADER_CREATE_BUTTON: "labels_header_create_button",
  LABELS_CONTEXT_MENU: "labels_context_menu",
  LABELS_DELETE_BUTTON: "labels_delete_button",
  ESTIMATES_TOGGLE_BUTTON: "estimates_toggle_button",
  ESTIMATES_EMPTY_STATE_CREATE_BUTTON: "estimates_empty_state_create_button",
  ESTIMATES_LIST_ITEM: "estimates_list_item",
  AUTOMATIONS_ARCHIVE_TOGGLE_BUTTON: "automations_archive_toggle_button",
  AUTOMATIONS_CLOSE_TOGGLE_BUTTON: "automations_close_toggle_button",
};

export const PROJECT_SETTINGS_TRACKER_EVENTS = {
  // labels
  label_created: "label_created",
  label_updated: "label_updated",
  label_deleted: "label_deleted",
  // estimates
  estimate_created: "estimate_created",
  estimate_updated: "estimate_updated",
  estimate_deleted: "estimate_deleted",
  estimates_toggle: "estimates_toggled",
  // automations
  auto_close_workitems: "auto_close_workitems",
  auto_archive_workitems: "auto_archive_workitems",
};

/**
 * ===========================================================================
 * Profile Settings Events and Elements
 * ===========================================================================
 */
export const PROFILE_SETTINGS_TRACKER_EVENTS = {
  // Account
  deactivate_account: "deactivate_account",
  update_profile: "update_profile",
  // Preferences
  first_day_updated: "first_day_updated",
  language_updated: "language_updated",
  timezone_updated: "timezone_updated",
  theme_updated: "theme_updated",
  // Notifications
  notifications_updated: "notifications_updated",
  // PAT
  pat_created: "pat_created",
  pat_deleted: "pat_deleted",
};

export const PROFILE_SETTINGS_TRACKER_ELEMENTS = {
  // Account
  SAVE_CHANGES_BUTTON: "save_changes_button",
  DEACTIVATE_ACCOUNT_BUTTON: "deactivate_account_button",
  // Preferences
  THEME_DROPDOWN: "preferences_theme_dropdown",
  FIRST_DAY_OF_WEEK_DROPDOWN: "preferences_first_day_of_week_dropdown",
  LANGUAGE_DROPDOWN: "preferences_language_dropdown",
  TIMEZONE_DROPDOWN: "preferences_timezone_dropdown",
  // Notifications
  PROPERTY_CHANGES_TOGGLE: "notifications_property_changes_toggle",
  STATE_CHANGES_TOGGLE: "notifications_state_changes_toggle",
  COMMENTS_TOGGLE: "notifications_comments_toggle",
  MENTIONS_TOGGLE: "notifications_mentions_toggle",
  // PAT
  HEADER_ADD_PAT_BUTTON: "header_add_pat_button",
  EMPTY_STATE_ADD_PAT_BUTTON: "empty_state_add_pat_button",
  LIST_ITEM_DELETE_ICON: "list_item_delete_icon",
};

/**
 * ===========================================================================
 * Workspace Settings Events and Elements
 * ===========================================================================
 */
export const WORKSPACE_SETTINGS_TRACKER_EVENTS = {
  // Billing
  upgrade_plan_redirected: "upgrade_plan_redirected",
  // Exports
  csv_exported: "csv_exported",
  // Webhooks
  webhook_created: "webhook_created",
  webhook_deleted: "webhook_deleted",
  webhook_toggled: "webhook_toggled",
  webhook_details_page_toggled: "webhook_details_page_toggled",
  webhook_updated: "webhook_updated",
};

export const WORKSPACE_SETTINGS_TRACKER_ELEMENTS = {
  // Billing
  BILLING_UPGRADE_BUTTON: (subscriptionType: EProductSubscriptionEnum) => `billing_upgrade_${subscriptionType}_button`,
  BILLING_TALK_TO_SALES_BUTTON: "billing_talk_to_sales_button",
  // Exports
  EXPORT_BUTTON: "export_button",
  // Webhooks
  HEADER_ADD_WEBHOOK_BUTTON: "header_add_webhook_button",
  EMPTY_STATE_ADD_WEBHOOK_BUTTON: "empty_state_add_webhook_button",
  LIST_ITEM_DELETE_BUTTON: "list_item_delete_button",
  WEBHOOK_LIST_ITEM_TOGGLE_SWITCH: "webhook_list_item_toggle_switch",
  WEBHOOK_DETAILS_PAGE_TOGGLE_SWITCH: "webhook_details_page_toggle_switch",
  WEBHOOK_DELETE_BUTTON: "webhook_delete_button",
  WEBHOOK_UPDATE_BUTTON: "webhook_update_button",
};
