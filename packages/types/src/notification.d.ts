import { TPaginationInfo } from "./common";
import type { IUserLite } from "./users";
import { ENotificationType } from "./enums";

export type TNotificationIssueLite = {
  id: string | undefined;
  sequence_id: number | undefined;
  identifier: string | undefined;
  name: string | undefined;
  state_name: string | undefined;
  state_group: string | undefined;
};

export type TNotificationData = {
  issue: TNotificationIssueLite | undefined;
  issue_activity: {
    id: string | undefined;
    actor: string | undefined;
    field: string | undefined;
    issue_comment: string | undefined;
    verb: "created" | "updated";
    new_value: string | undefined;
    old_value: string | undefined;
  };
};

export type TNotification = {
  id: string | undefined;
  title: string | undefined;
  data: TNotificationData | undefined;
  entity_identifier: string | undefined;
  entity_name: string | undefined;
  message_html: string | undefined;
  message: undefined;
  message_stripped: undefined;
  sender: string | undefined;
  receiver: string | undefined;
  triggered_by: string | undefined;
  triggered_by_details: IUserLite | undefined;
  read_at: Date | undefined;
  archived_at: string | undefined;
  snoozed_till: Date | undefined;
  workspace: string | undefined;
  project: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
};

export type TPaginatedNotification = {
  next_cursor: string | undefined;
  prev_cursor: string | undefined;
  next_page_results: boolean | undefined;
  prev_page_results: boolean | undefined;
  count: number | undefined;
  total_pages: number | undefined;
  extra_stats: undefined;
  results: TNotification[] | undefined;
};

export type TNotificationType =
  | ENotificationType.ALL
  | ENotificationType.ASSIGNED
  | ENotificationType.CREATED
  | ENotificationType.WATCHING;

export type TNotificationQueryParams = {
  snoozed?: boolean;
  type?: TNotificationType;
  archived?: boolean;
  read?: boolean;
};

export type TNotificationCount = {
  created_issues: number | undefined;
  my_issues: number | undefined;
  watching_issues: number | undefined;
};

export type TNotificationPaginationInfo = TPaginationInfo & {
  count: number | undefined;
  extra_stats: string | undefined;
  next_cursor: string | undefined;
  next_page_results: boolean | undefined;
  prev_cursor: string | undefined;
  prev_page_results: boolean | undefined;
  total_pages: number | undefined;
  per_page?: number | undefined;
  results: TNotification[] | undefined;
  grouped_by: string | undefined;
  sub_grouped_by: string | undefined;
  total_count: string | undefined;
};

export type TPaginatedNotificationQueryParams = {
  snoozed?: boolean;
  type?: TNotificationType;
  archived?: boolean;
  read?: boolean;
};
