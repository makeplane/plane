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
// components
import { useTimeLineRelationOptions } from "@/components/relations";

type Props = {
  issueId: string;
  issueServiceType?: TIssueServiceType;
};

export const RelationsCollapsibleTitle = observer(function RelationsCollapsibleTitle(props: Props) {
  const { issueId, issueServiceType = EIssueServiceType.ISSUES } = props;
  const { t } = useTranslation();
  // store hook
  const {
    relation: { getRelationCountByIssueId },
  } = useIssueDetail(issueServiceType);

  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  // derived values
  const relationsCount = getRelationCountByIssueId(issueId, ISSUE_RELATION_OPTIONS);

  return (
    <span className="inline-flex items-center gap-2">
      {t("common.relations")}
      <span className="flex items-center justify-center">
        <p className="text-14 leading-3! text-tertiary">{relationsCount}</p>
      </span>
    </span>
  );
});
