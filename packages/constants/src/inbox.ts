import { TInboxDuplicateIssueDetails, TIssue } from "@plane/types";

export enum EInboxIssueCurrentTab {
  OPEN = "open",
  CLOSED = "closed",
}

export enum EInboxIssueStatus {
  PENDING = -2,
  DECLINED = -1,
  SNOOZED = 0,
  ACCEPTED = 1,
  DUPLICATE = 2,
}

export type TInboxIssueCurrentTab = EInboxIssueCurrentTab;
export type TInboxIssueStatus = EInboxIssueStatus;
export type TInboxIssue = {
  id: string;
  status: TInboxIssueStatus;
  snoozed_till: Date | null;
  duplicate_to: string | undefined;
  source: string;
  issue: TIssue;
  created_by: string;
  duplicate_issue_detail: TInboxDuplicateIssueDetails | undefined;
};

export const INBOX_STATUS: {
  key: string;
  status: TInboxIssueStatus;
  i18n_title: string;
  i18n_description: () => string;
  textColor: (snoozeDatePassed: boolean) => string;
  bgColor: (snoozeDatePassed: boolean) => string;
}[] = [
  {
    key: "pending",
    i18n_title: "inbox_issue.status.pending.title",
    status: EInboxIssueStatus.PENDING,
    i18n_description: () => `inbox_issue.status.pending.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "text-[#AB6400]",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "bg-[#FFF7C2]",
  },
  {
    key: "declined",
    i18n_title: "inbox_issue.status.declined.title",
    status: EInboxIssueStatus.DECLINED,
    i18n_description: () => `inbox_issue.status.declined.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "text-[#CE2C31]",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "bg-[#FEEBEC]",
  },
  {
    key: "snoozed",
    i18n_title: "inbox_issue.status.snoozed.title",
    status: EInboxIssueStatus.SNOOZED,
    i18n_description: () => `inbox_issue.status.snoozed.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "text-red-500" : "text-custom-text-400",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "bg-red-500/10" : "bg-[#E0E1E6]",
  },
  {
    key: "accepted",
    i18n_title: "inbox_issue.status.accepted.title",
    status: EInboxIssueStatus.ACCEPTED,
    i18n_description: () => `inbox_issue.status.accepted.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "text-[#3E9B4F]",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "bg-[#E9F6E9]",
  },
  {
    key: "duplicate",
    i18n_title: "inbox_issue.status.duplicate.title",
    status: EInboxIssueStatus.DUPLICATE,
    i18n_description: () => `inbox_issue.status.duplicate.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "text-custom-text-200",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "bg-gray-500/10",
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
