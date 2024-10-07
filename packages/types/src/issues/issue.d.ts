import { TIssuePriorities } from "../issues";
import { TIssueAttachment } from "./issue_attachment";
import { TIssueLink } from "./issue_link";
import { TIssueReaction } from "./issue_reaction";

// new issue structure types

export type TBaseIssue = {
  id: string;
  sequence_id: number;
  name: string;
  sort_order: number;

  state_id: string | null;
  priority: TIssuePriorities | null;
  label_ids: string[];
  assignee_ids: string[];
  estimate_point: string | null;

  sub_issues_count: number;
  attachment_count: number;
  link_count: number;

  project_id: string | null;
  parent_id: string | null;
  cycle_id: string | null;
  module_ids: string[] | null;
  type_id: string | null;

  created_at: string;
  updated_at: string;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  archived_at: string | null;

  created_by: string;
  updated_by: string;

  is_draft: boolean;
};

export type TIssue = TBaseIssue & {
  description_html?: string;
  is_subscribed?: boolean;
  parent?: Partial<TBaseIssue>;
  issue_reactions?: TIssueReaction[];
  issue_attachment?: TIssueAttachment[];
  issue_link?: TIssueLink[];
  // tempId is used for optimistic updates. It is not a part of the API response.
  tempId?: string;
  // sourceIssueId is used to store the original issue id when creating a copy of an issue. Used in cloning property values. It is not a part of the API response.
  sourceIssueId?: string;
};

export type TIssueMap = {
  [issue_id: string]: TIssue;
};

type TIssueResponseResults =
  | TBaseIssue[]
  | {
      [key: string]: {
        results:
          | TBaseIssue[]
          | {
              [key: string]: {
                results: TBaseIssue[];
                total_results: number;
              };
            };
        total_results: number;
      };
    };

export type TIssuesResponse = {
  grouped_by: string;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  total_count: number;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: TIssueResponseResults;
};

export type TBulkIssueProperties = Pick<
  TIssue,
  | "state_id"
  | "priority"
  | "label_ids"
  | "assignee_ids"
  | "start_date"
  | "target_date"
  | "module_ids"
  | "cycle_id"
  | "estimate_point"
>;

export type TBulkOperationsPayload = {
  issue_ids: string[];
  properties: Partial<TBulkIssueProperties>;
};

export type TIssueDetailWidget =
  | "sub-issues"
  | "relations"
  | "links"
  | "attachments";
