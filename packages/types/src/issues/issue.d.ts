import { TIssuePriorities } from "../issues";
import { TIssueAttachment } from "./issue_attachment";
import { TIssueLink } from "./issue_link";
import { TIssueReaction } from "./issue_reaction";

// new issue structure types
export type TIssue = {
  id: string;
  sequence_id: number;
  name: string;
  description_html: string;
  sort_order: number;

  state_id: string;
  priority: TIssuePriorities;
  label_ids: string[];
  assignee_ids: string[];
  estimate_point: number | null;

  sub_issues_count: number;
  attachment_count: number;
  link_count: number;

  project_id: string;
  parent_id: string | null;
  cycle_id: string | null;
  module_ids: string[] | null;

  created_at: string;
  updated_at: string;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  archived_at: string | null;

  created_by: string;
  updated_by: string;

  is_draft: boolean;
  is_subscribed?: boolean;

  parent?: partial<TIssue>;
  issue_reactions?: TIssueReaction[];
  issue_attachment?: TIssueAttachment[];
  issue_link?: TIssueLink[];

  // tempId is used for optimistic updates. It is not a part of the API response.
  tempId?: string;
};

export type TIssueMap = {
  [issue_id: string]: TIssue;
};
