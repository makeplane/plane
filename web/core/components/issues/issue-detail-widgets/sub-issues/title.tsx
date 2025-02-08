"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueServiceType } from "@plane/types";
import { CircularProgressIndicator, CollapsibleButton } from "@plane/ui";
// components
import { SubIssuesActionButton } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  parentIssueId: string;
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
};

export const SubIssuesCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, parentIssueId, disabled, issueServiceType = EIssueServiceType.ISSUES } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    subIssues: { subIssuesByIssueId, stateDistributionByIssueId },
  } = useIssueDetail(issueServiceType);

  // derived data
  const subIssuesDistribution = stateDistributionByIssueId(parentIssueId);
  const subIssues = subIssuesByIssueId(parentIssueId);

  // if there are no sub-issues, return null
  if (!subIssues) return null;

  // calculate percentage of completed sub-issues
  const completedCount = subIssuesDistribution?.completed?.length ?? 0;
  const totalCount = subIssues.length;
  const percentage = completedCount && totalCount ? (completedCount / totalCount) * 100 : 0;

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={`${issueServiceType === EIssueServiceType.EPICS ? t("issue.label", { count: 1 }) : t("common.sub_work_items")}`}
      indicatorElement={
        <div className="flex items-center gap-1.5 text-custom-text-300 text-sm">
          <CircularProgressIndicator size={18} percentage={percentage} strokeWidth={3} />
          <span>
            {completedCount}/{totalCount} {t("common.done")}
          </span>
        </div>
      }
      actionItemElement={
        !disabled && (
          <SubIssuesActionButton issueId={parentIssueId} disabled={disabled} issueServiceType={issueServiceType} />
        )
      }
    />
  );
});
