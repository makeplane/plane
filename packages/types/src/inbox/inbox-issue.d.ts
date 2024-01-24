import { TIssue } from "../issues/base";

export enum EInboxStatus {
  PENDING = -2,
  REJECT = -1,
  SNOOZED = 0,
  ACCEPTED = 1,
  DUPLICATE = 2,
}

export type TInboxStatus =
  | EInboxStatus.PENDING
  | EInboxStatus.REJECT
  | EInboxStatus.SNOOZED
  | EInboxStatus.ACCEPTED
  | EInboxStatus.DUPLICATE;

export type TInboxIssueDetail = {
  id?: string;
  source: "in-app";
  status: TInboxStatus;
  duplicate_to: string | undefined;
  snoozed_till: Date | undefined;
};

export type TInboxIssueDetailMap = Record<
  string,
  Record<string, TInboxIssueDetail>
>; // inbox_id -> issue_id -> TInboxIssueDetail

export type TInboxIssueDetailIdMap = Record<string, string[]>; // inbox_id -> issue_id[]

export type TInboxIssueExtendedDetail = TIssue & {
  issue_inbox: TInboxIssueDetail[];
};

// property type checks
export type TInboxPendingStatus = {
  status: EInboxStatus.PENDING;
};

export type TInboxRejectStatus = {
  status: EInboxStatus.REJECT;
};

export type TInboxSnoozedStatus = {
  status: EInboxStatus.SNOOZED;
  snoozed_till: Date;
};

export type TInboxAcceptedStatus = {
  status: EInboxStatus.ACCEPTED;
};

export type TInboxDuplicateStatus = {
  status: EInboxStatus.DUPLICATE;
  duplicate_to: string; // issue_id
};

export type TInboxDetailedStatus =
  | TInboxPendingStatus
  | TInboxRejectStatus
  | TInboxSnoozedStatus
  | TInboxAcceptedStatus
  | TInboxDuplicateStatus;
