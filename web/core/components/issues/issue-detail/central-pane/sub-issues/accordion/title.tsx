import React, { FC } from "react";
import { observer } from "mobx-react";
import { CircularProgressIndicator } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
import { AccordionButton } from "../../common/accordion-button";
import { SubIssuesActionButton } from "../action-item-button";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  disabled: boolean;
};

export const SubIssuesAccordionTitle: FC<Props> = observer((props) => {
  const { isOpen, workspaceSlug, projectId, parentIssueId, disabled } = props;

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
  const indicatorElement = (
    <div className="flex items-center gap-1.5 text-custom-text-300 text-xs">
      <CircularProgressIndicator size={18} percentage={percentage} strokeWidth={3} />
      <span>
        {completedCount}/{totalCount} Done
      </span>
    </div>
  );

  return (
    <AccordionButton
      isOpen={isOpen}
      title="Sub-issues"
      indicatorElement={indicatorElement}
      actionItemElement={
        <SubIssuesActionButton
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          parentIssueId={parentIssueId}
          disabled={disabled}
        />
      }
    />
  );
});
