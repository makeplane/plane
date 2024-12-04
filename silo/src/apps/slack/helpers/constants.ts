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
  ENABLE_THREAD_SYNC: "enable_thread_sync",
  ASSIGN_TO_ME: "assign_to_me",
};

export const ENTITIES = {
  ISSUE_SUBMISSION: "issue_submission",
  ISSUE_COMMENT_SUBMISSION: "issue_comment_submission",
};

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
