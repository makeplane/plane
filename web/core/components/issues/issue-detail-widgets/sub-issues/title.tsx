"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { CircularProgressIndicator, CollapsibleButton } from "@plane/ui";
// components
import { SubIssuesActionButton } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  parentIssueId: string;
  disabled: boolean;
};

export const SubIssuesCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, parentIssueId, disabled } = props;
  // store hooks
  const {
    subIssues: { subIssuesByIssueId, stateDistributionByIssueId },
  } = useIssueDetail();

  // derived data
  const subIssuesDistribution = stateDistributionByIssueId(parentIssueId);
  const subIssues = subIssuesByIssueId(parentIssueId);

  // if there are no sub-issues, return null
  if (!subIssues) return null;

  // calculate percentage of completed sub-issues
  const completedCount = subIssuesDistribution?.completed?.length ?? 0;
  const totalCount = subIssues.length;
  const percentage = completedCount && totalCount ? (completedCount / totalCount) * 100 : 0;

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <div className="flex items-center gap-1.5 text-custom-text-300 text-sm">
        <CircularProgressIndicator size={18} percentage={percentage} strokeWidth={3} />
        <span>
          {completedCount}/{totalCount} Done
        </span>
      </div>
    ),
    [completedCount, totalCount, percentage]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title="Sub-issues"
      indicatorElement={indicatorElement}
      actionItemElement={!disabled && <SubIssuesActionButton issueId={parentIssueId} disabled={disabled} />}
    />
  );
});
