export * from "./issue_activity";
export * from "./issue_comment";
export * from "./issue_comment_reaction";

import { TIssuePriorities } from "../issues";

// root types
export type TIssueActivityWorkspaceDetail = {
  name: string;
  slug: string;
  id: string;
};

export type TIssueActivityProjectDetail = {
  id: string;
  identifier: string;
  name: string;
  cover_image: string;
  description: string | null;
  emoji: string | null;
  icon_prop: {
    name: string;
    color: string;
  } | null;
};

export type TIssueActivityIssueDetail = {
  id: string;
  sequence_id: boolean;
  sort_order: boolean;
  name: string;
  description_html: string;
  priority: TIssuePriorities;
  start_date: string;
  target_date: string;
  is_draft: boolean;
};

export type TIssueActivityUserDetail = {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  is_bot: boolean;
  display_name: string;
};

export type TIssueActivityComment =
  | {
      id: string;
      activity_type: "COMMENT";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "ACTIVITY";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "WORKLOG";
      created_at?: string;
    }
  | {
      id: string;
      activity_type: "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY";
      created_at?: string;
    };
