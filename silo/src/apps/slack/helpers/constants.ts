export const ACTIONS = {
  PROJECT: "project",
  ISSUE_TITLE: "issue_title",
  ISSUE_STATE: "issue_state",
  ISSUE_LABELS: "issue_labels",
  ISSUE_PRIORITY: "issue_priority",
  ISSUE_DESCRIPTION: "issue_description",

  LINKBACK_STATE_CHANGE: "linkback_state_change",
  LINKBACK_CREATE_COMMENT: "create_comment",
  LINKBACK_SWITCH_CYCLE: "switch_cycle",
  LINKBACK_SWITCH_PRIORITY: "switch_priority",
  LINKBACK_COMMENT_SUBMIT: "comment_submit",
  LINKBACK_ADD_WEB_LINK: "add_web_link",
  LINKBACK_OVERFLOW_ACTIONS: "linkback_overflow_actions",

  ENABLE_THREAD_SYNC: "enable_thread_sync",
  ASSIGN_TO_ME: "assign_to_me",

  LINK_WORK_ITEM: "link_work_item",
};

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
