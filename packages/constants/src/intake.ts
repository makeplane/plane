import type { TInboxIssueStatus } from "@plane/types";
import { EInboxIssueStatus } from "@plane/types";

export const INBOX_STATUS = [
  {
    key: "pending",
    i18n_title: "inbox_issue.status.pending.title" as const,
    status: EInboxIssueStatus.PENDING,
    i18n_description: () => `inbox_issue.status.pending.description`,
  },
  {
    key: "declined",
    i18n_title: "inbox_issue.status.declined.title" as const,
    status: EInboxIssueStatus.DECLINED,
    i18n_description: () => `inbox_issue.status.declined.description`,
  },
  {
    key: "snoozed",
    i18n_title: "inbox_issue.status.snoozed.title" as const,
    status: EInboxIssueStatus.SNOOZED,
    i18n_description: () => `inbox_issue.status.snoozed.description`,
  },
  {
    key: "accepted",
    i18n_title: "inbox_issue.status.accepted.title" as const,
    status: EInboxIssueStatus.ACCEPTED,
    i18n_description: () => `inbox_issue.status.accepted.description`,
  },
  {
    key: "duplicate",
    i18n_title: "inbox_issue.status.duplicate.title" as const,
    status: EInboxIssueStatus.DUPLICATE,
    i18n_description: () => `inbox_issue.status.duplicate.description`,
  },
];

export const INBOX_ISSUE_ORDER_BY_OPTIONS = [
  {
    key: "issue__created_at",
    i18n_label: "inbox_issue.order_by.created_at" as const,
  },
  {
    key: "issue__updated_at",
    i18n_label: "inbox_issue.order_by.updated_at" as const,
  },
  {
    key: "issue__sequence_id",
    i18n_label: "inbox_issue.order_by.id" as const,
  },
];

export const INBOX_ISSUE_SORT_BY_OPTIONS = [
  {
    key: "asc",
    i18n_label: "common.sort.asc" as const,
  },
  {
    key: "desc",
    i18n_label: "common.sort.desc" as const,
  },
];

export enum EPastDurationFilters {
  TODAY = "today",
  YESTERDAY = "yesterday",
  LAST_7_DAYS = "last_7_days",
  LAST_30_DAYS = "last_30_days",
}

export const PAST_DURATION_FILTER_OPTIONS: {
  name: string;
  value: string;
}[] = [
  {
    name: "Today",
    value: EPastDurationFilters.TODAY,
  },
  {
    name: "Yesterday",
    value: EPastDurationFilters.YESTERDAY,
  },
  {
    name: "Last 7 days",
    value: EPastDurationFilters.LAST_7_DAYS,
  },
  {
    name: "Last 30 days",
    value: EPastDurationFilters.LAST_30_DAYS,
  },
];
