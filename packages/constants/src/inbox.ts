import { TInboxDuplicateIssueDetails, TIssue } from "@plane/types";

export const EInboxIssueCurrentTab = {
  OPEN: "open",
  CLOSED: "closed",
} as const;

export type EInboxIssueCurrentTab = typeof EInboxIssueCurrentTab[keyof typeof EInboxIssueCurrentTab];

export const EInboxIssueStatus = {
  PENDING: -2,
  DECLINED: -1,
  SNOOZED: 0,
  ACCEPTED: 1,
  DUPLICATE: 2,
} as const;

export type EInboxIssueStatus = typeof EInboxIssueStatus[keyof typeof EInboxIssueStatus];

export const EInboxIssueSource = {
  IN_APP: "IN_APP",
  FORMS: "FORMS",
  EMAIL: "EMAIL",
} as const;

export type EInboxIssueSource = typeof EInboxIssueSource[keyof typeof EInboxIssueSource];

export type TInboxIssueCurrentTab = EInboxIssueCurrentTab;
export type TInboxIssueStatus = EInboxIssueStatus;
export type TInboxIssue = {
  id: string;
  status: TInboxIssueStatus;
  snoozed_till: Date | null;
  duplicate_to: string | undefined;
  source: EInboxIssueSource | undefined;
  issue: TIssue;
  created_by: string;
  duplicate_issue_detail: TInboxDuplicateIssueDetails | undefined;
};

export const INBOX_STATUS: {
  key: string;
  status: TInboxIssueStatus;
  i18n_title: string;
  i18n_description: () => string;
}[] = [
  {
    key: "pending",
    i18n_title: "inbox_issue.status.pending.title",
    status: EInboxIssueStatus.PENDING,
    i18n_description: () => `inbox_issue.status.pending.description`,
  },
  {
    key: "declined",
    i18n_title: "inbox_issue.status.declined.title",
    status: EInboxIssueStatus.DECLINED,
    i18n_description: () => `inbox_issue.status.declined.description`,
  },
  {
    key: "snoozed",
    i18n_title: "inbox_issue.status.snoozed.title",
    status: EInboxIssueStatus.SNOOZED,
    i18n_description: () => `inbox_issue.status.snoozed.description`,
  },
  {
    key: "accepted",
    i18n_title: "inbox_issue.status.accepted.title",
    status: EInboxIssueStatus.ACCEPTED,
    i18n_description: () => `inbox_issue.status.accepted.description`,
  },
  {
    key: "duplicate",
    i18n_title: "inbox_issue.status.duplicate.title",
    status: EInboxIssueStatus.DUPLICATE,
    i18n_description: () => `inbox_issue.status.duplicate.description`,
  },
];

export const INBOX_ISSUE_ORDER_BY_OPTIONS = [
  {
    key: "issue__created_at",
    i18n_label: "inbox_issue.order_by.created_at",
  },
  {
    key: "issue__updated_at",
    i18n_label: "inbox_issue.order_by.updated_at",
  },
  {
    key: "issue__sequence_id",
    i18n_label: "inbox_issue.order_by.id",
  },
];

export const INBOX_ISSUE_SORT_BY_OPTIONS = [
  {
    key: "asc",
    i18n_label: "common.sort.asc",
  },
  {
    key: "desc",
    i18n_label: "common.sort.desc",
  },
];
