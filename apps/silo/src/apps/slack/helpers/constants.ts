export const ACTIONS = {
  PROJECT: "project",
  ISSUE_OBJECT_TYPE_SELECTION: "issue_object_type_selection",
  ISSUE_TITLE: "issue_title",
  ISSUE_TYPE: "issue_type",
  ISSUE_STATE: "issue_state",
  ISSUE_LABELS: "issue_labels",
  ISSUE_PRIORITY: "issue_priority",
  ISSUE_DESCRIPTION: "issue_description",

  LINKBACK_STATE_CHANGE: "linkback_state_change",
  LINKBACK_SWITCH_PRIORITY: "switch_priority",

  LINKBACK_CREATE_COMMENT: "create_comment",
  LINKBACK_COMMENT_SUBMIT: "comment_submit",
  LINKBACK_ADD_WEB_LINK: "add_web_link",
  LINKBACK_OVERFLOW_ACTIONS: "linkback_overflow_actions",

  ENABLE_THREAD_SYNC: "enable_thread_sync",
  ASSIGN_TO_ME: "assign_to_me",
  UPDATE_WORK_ITEM: "update_work_item",

  LINK_WORK_ITEM: "link_work_item",
  CREATE_WORK_ITEM: "create_work_item",
};

export enum E_ISSUE_OBJECT_TYPE_SELECTION {
  WORK_ITEM = "work_item",
  INTAKE = "intake",
}

export type EntityType = keyof typeof ENTITIES;
export type EntityTypeValue = (typeof ENTITIES)[keyof typeof ENTITIES];

export const ENTITIES = {
  SHORTCUT_PROJECT_SELECTION: "shortcut_project_selection",
  COMMAND_PROJECT_SELECTION: "command_project_selection",
  ISSUE_SUBMISSION: "issue_submission",
  ISSUE_COMMENT_SUBMISSION: "issue_comment_submission",
  ISSUE_WEBLINK_SUBMISSION: "issue_weblink_submission",
  LINK_WORK_ITEM: "link_work_item",
  DISCONNECT_WORK_ITEM: "disconnect_work_item",
} as const;

export const PLANE_PRIORITIES = [
  {
    id: "urgent",
    name: "Urgent",
    value: "urgent",
  },
  {
    id: "high",
    name: "High",
    value: "high",
  },
  {
    id: "medium",
    name: "Medium",
    value: "medium",
  },
  {
    id: "low",
    name: "Low",
    value: "low",
  },
  {
    id: "none",
    name: "None",
    value: "none",
  },
];

// Intake issue statuses based on the Django model
export const INTAKE_STATUSES = [
  { id: -2, name: "Pending", emoji: "⏳" },
  { id: -1, name: "Rejected", emoji: "❌" },
  { id: 0, name: "Snoozed", emoji: "😴" },
  { id: 1, name: "Accepted", emoji: "✅" },
  { id: 2, name: "Duplicate", emoji: "🔄" },
];

export const IGNORED_FIELD_UPDATES = [
  "description",
  "description_html",
  "attachment",
  "sort_order",
  "link",
  "reaction",
];
