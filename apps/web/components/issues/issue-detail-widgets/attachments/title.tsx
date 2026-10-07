/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  issueId: string;
  issueServiceType?: TIssueServiceType;
};

export const IssueAttachmentsCollapsibleTitle = observer(function IssueAttachmentsCollapsibleTitle(props: Props) {
  const { issueId, issueServiceType = EIssueServiceType.ISSUES } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(issueServiceType);

  // derived values
  const issue = getIssueById(issueId);
  const attachmentCount = issue?.attachment_count ?? 0;

  return (
    <span className="inline-flex items-center gap-2">
      {t("common.attachments")}
      <span className="flex items-center justify-center">
        <p className="text-14 leading-3! text-tertiary">{attachmentCount}</p>
      </span>
    </span>
  );
});
