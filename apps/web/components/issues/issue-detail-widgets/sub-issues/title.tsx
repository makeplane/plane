/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { CircularProgress } from "@makeplane/propel/components/circular-progress";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  parentIssueId: string;
  issueServiceType?: TIssueServiceType;
};

/** Completed / total sub-work items as a compact ring + count chip next to the section title. */
export const SubIssuesProgressChip = observer(function SubIssuesProgressChip(props: Props) {
  const { parentIssueId, issueServiceType = EIssueServiceType.ISSUES } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    subIssues: { subIssuesByIssueId, stateDistributionByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const subIssuesDistribution = stateDistributionByIssueId(parentIssueId);
  const subIssues = subIssuesByIssueId(parentIssueId);
  // if there are no sub-issues, return null
  if (!subIssues?.length) return null;

  // calculate percentage of completed sub-issues
  const completedCount = subIssuesDistribution?.completed?.length ?? 0;
  const totalCount = subIssues.length;
  const percentage = completedCount && totalCount ? (completedCount / totalCount) * 100 : 0;
  const label = `${completedCount}/${totalCount} ${t("common.done")}`;

  return (
    <Tooltip label={label}>
      <span className="flex h-5 items-center gap-1 rounded-sm px-1.5 text-secondary hover:bg-layer-1-hover">
        <CircularProgress
          value={percentage}
          size="sm"
          variant={percentage === 100 ? "success" : "brand"}
          aria-label={t("common.progress")}
        />
        <span className="text-caption-md-medium leading-none">
          {completedCount}/{totalCount}
        </span>
      </span>
    </Tooltip>
  );
});
