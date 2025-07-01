export type IssueEventProps = {
  eventName: string;
  payload: any;
  updates?: any;
  path?: string;
};

export type EventProps = {
  eventName: string;
  payload: any;
  updates?: any;
  path?: string;
};

export const getPageEventPayload = (payload: any) => ({
  workspace_id: payload.workspace_id,
  project_id: payload.project,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  access: payload.access === 0 ? "Public" : "Private",
  is_locked: payload.is_locked,
  archived_at: payload.archived_at,
  created_by: payload.created_by,
  state: payload.state,
  element: payload.element,
});

export const getIssueEventPayload = (props: IssueEventProps) => {
  const { eventName, payload, updates, path } = props;
  let eventPayload: any = {
    issue_id: payload.id,
    estimate_point: payload.estimate_point,
    link_count: payload.link_count,
    target_date: payload.target_date,
    is_draft: payload.is_draft,
    label_ids: payload.label_ids,
    assignee_ids: payload.assignee_ids,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
    sequence_id: payload.sequence_id,
    module_ids: payload.module_ids,
    sub_issues_count: payload.sub_issues_count,
    parent_id: payload.parent_id,
    project_id: payload.project_id,
    workspace_id: payload.workspace_id,
    priority: payload.priority,
    state_id: payload.state_id,
    start_date: payload.start_date,
    attachment_count: payload.attachment_count,
    cycle_id: payload.cycle_id,
    module_id: payload.module_id,
    archived_at: payload.archived_at,
    state: payload.state,
    view_id: path?.includes("workspace-views") || path?.includes("views") ? path.split("/").pop() : "",
  };

  if (eventName === WORK_ITEM_TRACKER_EVENTS.update) {
    eventPayload = {
      ...eventPayload,
      ...updates,
      updated_from: props.path?.includes("workspace-views")
        ? "All views"
        : props.path?.includes("cycles")
          ? "Cycle"
          : props.path?.includes("modules")
            ? "Module"
            : props.path?.includes("views")
              ? "Project view"
              : props.path?.includes("inbox")
                ? "Inbox"
                : props.path?.includes("draft")
                  ? "Draft"
                  : "Project",
    };
  }
  return eventPayload;
};

export const getProjectStateEventPayload = (payload: any) => ({
  workspace_id: payload.workspace_id,
  project_id: payload.id,
  state_id: payload.id,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  group: payload.group,
  color: payload.color,
  default: payload.default,
  state: payload.state,
  element: payload.element,
});

// Dashboard Events
export const GITHUB_REDIRECTED_TRACKER_EVENT = "github_redirected";
export const HEADER_GITHUB_ICON = "header_github_icon";

// Groups
export const GROUP_WORKSPACE_TRACKER_EVENT = "workspace_metrics";

// Command palette tracker
export const COMMAND_PALETTE_TRACKER_ELEMENTS = {
  COMMAND_PALETTE_SHORTCUT_KEY: "command_palette_shortcut_key",
};

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

export const PROJECT_TRACKER_EVENTS = {
  create: "project_created",
  update: "project_updated",
  delete: "project_deleted",
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

export const AUTH_TRACKER_EVENTS = {
  code_verify: "code_verified",
  sign_up_with_password: "sign_up_with_password",
  sign_in_with_password: "sign_in_with_password",
  forgot_password: "forgot_password_clicked",
  new_code_requested: "new_code_requested",
};
export const AUTH_TRACKER_ELEMENTS = {
  NAVIGATE_TO_SIGN_UP: "navigate_to_sign_up",
  FORGOT_PASSWORD_FROM_SIGNIN: "forgot_password_from_signin",
  SIGNUP_FROM_FORGOT_PASSWORD: "signup_from_forgot_password",
  SIGN_IN_FROM_SIGNUP: "sign_in_from_signup",
  SIGN_IN_WITH_UNIQUE_CODE: "sign_in_with_unique_code",
  REQUEST_NEW_CODE: "request_new_code",
  VERIFY_CODE: "verify_code",
};

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

export const PRODUCT_TOUR_TRACKER_EVENTS = {
  complete: "product_tour_completed",
};
export const PRODUCT_TOUR_TRACKER_ELEMENTS = {
  START_BUTTON: "product_tour_start_button",
  SKIP_BUTTON: "product_tour_skip_button",
  CREATE_PROJECT_BUTTON: "product_tour_create_project_button",
};

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

export const USER_TRACKER_EVENTS = {
  add_details: "user_details_added",
  onboarding_complete: "user_onboarding_completed",
};
export const ONBOARDING_TRACKER_ELEMENTS = {
  PROFILE_SETUP_FORM: "onboarding_profile_setup_form",
};

export const SIDEBAR_TRACKER_ELEMENTS = {
  USER_MENU_ITEM: "sidenav_user_menu_item",
  CREATE_WORK_ITEM_BUTTON: "sidebar_create_work_item_button",
};
