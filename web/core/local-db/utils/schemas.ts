export type Schema = {
  [key: string]: string;
};

export const issueSchema: Schema = {
  id: "TEXT UNIQUE",
  name: "TEXT",
  state_id: "TEXT",
  sort_order: "REAL",
  completed_at: "TEXT",
  estimate_point: "REAL",
  priority: "TEXT",
  priority_proxy: "INTEGER",
  start_date: "TEXT",
  target_date: "TEXT",
  sequence_id: "INTEGER",
  project_id: "TEXT",
  parent_id: "TEXT",
  created_at: "TEXT",
  updated_at: "TEXT",
  created_by: "TEXT",
  updated_by: "TEXT",
  is_draft: "INTEGER",
  archived_at: "TEXT",
  state__group: "TEXT",
  sub_issues_count: "INTEGER",
  cycle_id: "TEXT",
  link_count: "INTEGER",
  attachment_count: "INTEGER",
  type_id: "TEXT",
  label_ids: "TEXT",
  assignee_ids: "TEXT",
  module_ids: "TEXT",
  description_html: "TEXT",
  is_local_update: "INTEGER",
};

export const issueMetaSchema: Schema = {
  issue_id: "TEXT",
  key: "TEXT",
  value: "TEXT",
};
export const moduleSchema: Schema = {
  id: "TEXT UNIQUE",
  workspace_id: "TEXT",
  project_id: "TEXT",
  name: "TEXT",
  description: "TEXT",
  description_text: "TEXT",
  description_html: "TEXT",
  start_date: "TEXT",
  target_date: "TEXT",
  status: "TEXT",
  lead_id: "TEXT",
  member_ids: "TEXT",
  view_props: "TEXT",
  sort_order: "INTEGER",
  external_source: "TEXT",
  external_id: "TEXT",
  logo_props: "TEXT",
  total_issues: "INTEGER",
  cancelled_issues: "INTEGER",
  completed_issues: "INTEGER",
  started_issues: "INTEGER",
  unstarted_issues: "INTEGER",
  backlog_issues: "INTEGER",
  created_at: "TEXT",
  updated_at: "TEXT",
  archived_at: "TEXT",
};

export const labelSchema: Schema = {
  id: "TEXT UNIQUE",
  name: "TEXT",
  color: "TEXT",
  parent: "TEXT",
  project_id: "TEXT",
  workspace_id: "TEXT",
  sort_order: "INTEGER",
};

export const cycleSchema: Schema = {
  id: "TEXT UNIQUE",
  workspace_id: "TEXT",
  project_id: "TEXT",
  name: "TEXT",
  description: "TEXT",
  start_date: "TEXT",
  end_date: "TEXT",
  owned_by_id: "TEXT",
  view_props: "TEXT",
  sort_order: "INTEGER",
  external_source: "TEXT",
  external_id: "TEXT",
  progress_snapshot: "TEXT",
  logo_props: "TEXT",
  total_issues: "INTEGER",
  cancelled_issues: "INTEGER",
  completed_issues: "INTEGER",
  started_issues: "INTEGER",
  unstarted_issues: "INTEGER",
  backlog_issues: "INTEGER",
};

export const stateSchema: Schema = {
  id: "TEXT UNIQUE",
  project_id: "TEXT",
  workspace_id: "TEXT",
  name: "TEXT",
  color: "TEXT",
  group: "TEXT",
  default: "BOOLEAN",
  description: "TEXT",
  sequence: "INTEGER",
};

export const estimatePointSchema: Schema = {
  id: "TEXT UNIQUE",
  key: "TEXT",
  value: "REAL",
};

export const memberSchema: Schema = {
  id: "TEXT UNIQUE",
  first_name: "TEXT",
  last_name: "TEXT",
  avatar: "TEXT",
  is_bot: "BOOLEAN",
  display_name: "TEXT",
  email: "TEXT",
};

export const optionsSchema: Schema = {
  key: "TEXT UNIQUE",
  value: "TEXT",
};
