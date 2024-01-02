// new issue structure types
export type TIssue = {
  id: string;
  name: string;
  state_id: string;
  description_html: string;
  sort_order: number;
  completed_at: string | null;
  estimate_point: number | null;
  priority: TIssuePriorities;
  start_date: string;
  target_date: string;
  sequence_id: number;
  project_id: string;
  parent_id: string | null;
  cycle_id: string | null;
  module_id: string | null;
  label_ids: string[];
  assignee_ids: string[];
  sub_issues_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  attachment_count: number;
  link_count: number;
  is_subscribed: boolean;
  archived_at: boolean;
  is_draft: boolean;
  // tempId is used for optimistic updates. It is not a part of the API response.
  tempId?: string;
};

export type TIssueMap = {
  [issue_id: string]: TIssue;
};
