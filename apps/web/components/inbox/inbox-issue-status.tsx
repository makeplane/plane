/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Badge } from "@makeplane/propel/components/badge";
import type { BadgeVariant } from "@makeplane/propel/components/badge";
import { Icon } from "@makeplane/propel/components/icon";
// constants
import { INBOX_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TInboxIssueStatus } from "@plane/types";
import { EInboxIssueStatus } from "@plane/types";
import { findHowManyDaysLeft } from "@plane/utils";
// store
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { ICON_PROPERTIES } from "./inbox-status-icon";

const STATUS_BADGE_VARIANT: Record<TInboxIssueStatus, BadgeVariant> = {
  [EInboxIssueStatus.PENDING]: "warning",
  [EInboxIssueStatus.DECLINED]: "danger",
  [EInboxIssueStatus.SNOOZED]: "neutral",
  [EInboxIssueStatus.ACCEPTED]: "success",
  [EInboxIssueStatus.DUPLICATE]: "neutral",
};

type Props = {
  inboxIssue: IInboxIssueStore;
};

export const InboxIssueStatus = observer(function InboxIssueStatus(props: Props) {
  const { inboxIssue } = props;
  //hooks
  const { t } = useTranslation();
  // derived values
  const inboxIssueStatusDetail = INBOX_STATUS.find((s) => s.status === inboxIssue.status);

  const isSnoozedDatePassed = inboxIssue.status === 0 && new Date(inboxIssue.snoozed_till ?? "") < new Date();
  if (!inboxIssueStatusDetail || isSnoozedDatePassed) return <></>;

  const description = t(inboxIssueStatusDetail.i18n_description(), {
    days: findHowManyDaysLeft(new Date(inboxIssue.snoozed_till ?? "")),
  });
  const statusIcon = ICON_PROPERTIES[inboxIssue.status];

  return (
    <Badge
      variant={STATUS_BADGE_VARIANT[inboxIssue.status]}
      size="sm"
      startIcon={<Icon icon={statusIcon.icon} />}
      label={inboxIssue.status === 0 && inboxIssue.snoozed_till ? description : t(inboxIssueStatusDetail.i18n_title)}
    />
  );
});
