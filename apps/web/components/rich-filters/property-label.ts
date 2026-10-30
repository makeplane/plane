/** Localize built-in field names without changing identifiers or user-defined labels. */
const PROPERTY_LABEL_KEYS: Record<string, string> = {
  state_id: "common.state",
  state_group: "common.state_group",
  assignee_id: "common.assignees",
  priority: "common.priority",
  mention_id: "mentions",
  label_id: "common.label",
  cycle_id: "common.cycle",
  module_id: "common.module",
  start_date: "start_date",
  target_date: "due_date",
  created_at: "common.created_at",
  updated_at: "common.updated_at",
};

export const getFilterPropertyLabel = (property: string, fallback: string, t: (key: string) => string): string => {
  const key = PROPERTY_LABEL_KEYS[property];
  return key ? t(key) : fallback;
};
