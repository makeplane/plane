import type { IUserLite } from "./users";

export interface PaginatedUserNotification {
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: IUserNotification[];
}

export interface IUserNotification {
  archived_at: string | null;
  created_at: string;
  created_by: null;
  data: Data;
  entity_identifier: string;
  entity_name: string;
  id: string;
  message: null;
  message_html: string;
  message_stripped: null;
  project: string;
  read_at: Date | null;
  receiver: string;
  sender: string;
  snoozed_till: Date | null;
  title: string;
  triggered_by: string;
  triggered_by_details: IUserLite;
  updated_at: Date;
  updated_by: null;
  workspace: string;
}

export interface Data {
  issue: INotificationIssueLite;
  issue_activity: {
    actor: string;
    field: string;
    id: string;
    issue_comment: string | null;
    new_value: string;
    old_value: string;
    verb: "created" | "updated";
  };
}

export interface INotificationIssueLite {
  id: string;
  name: string;
  identifier: string;
  state_name: string;
  sequence_id: number;
  state_group: string;
}

export type NotificationType = "created" | "assigned" | "watching" | "all";

export interface INotificationParams {
  snoozed?: boolean;
  type?: NotificationType;
  archived?: boolean;
  read?: boolean;
}

export type NotificationCount = {
  created_issues: number;
  my_issues: number;
  watching_issues: number;
};

export interface IMarkAllAsReadPayload {
  archived?: boolean;
  snoozed?: boolean;
  type?: NotificationType;
}
