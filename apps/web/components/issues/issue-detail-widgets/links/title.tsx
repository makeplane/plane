/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  issueId: string;
  issueServiceType: TIssueServiceType;
};

export const IssueLinksCollapsibleTitle = observer(function IssueLinksCollapsibleTitle(props: Props) {
  const { issueId, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(issueServiceType);

  // derived values
  const issue = getIssueById(issueId);

  const linksCount = issue?.link_count ?? 0;

  return (
    <span className="inline-flex items-center gap-2">
      {t("common.links")}
      <span className="flex items-center justify-center">
        <p className="text-14 leading-3! text-tertiary">{linksCount}</p>
      </span>
    </span>
  );
});
