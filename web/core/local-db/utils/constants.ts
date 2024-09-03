export const ARRAY_FIELDS = ["label_ids", "assignee_ids", "module_ids"];

export const GROUP_BY_MAP = {
  state_id: "state_id",
  priority: "priority",
  cycle_id: "cycle_id",
  created_by: "created_by",
  // Array Props
  issue_module__module_id: "module_ids",
  labels__id: "label_ids",
  assignees__id: "assignee_ids",
  target_date: "target_date",
};

export const PRIORITY_MAP = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
  none: 0,
};
