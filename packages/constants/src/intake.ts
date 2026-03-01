/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TInboxIssueStatus } from "@plane/types";
import { EInboxIssueStatus } from "@plane/types";

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

export const INTAKE_DISABLED_STATUSES = [
  EInboxIssueStatus.DECLINED, // -1
  EInboxIssueStatus.ACCEPTED, // 1
  EInboxIssueStatus.DUPLICATE, // 2
] as const;

export const INTAKE_ACTIONABLE_STATUSES = [
  EInboxIssueStatus.PENDING, // 0
  EInboxIssueStatus.SNOOZED, // -2
] as const;

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
