"use client";

import { FC } from "react";
import { omit } from "lodash-es";
import { observer } from "mobx-react";
// constants
import { EIssueServiceType } from "@plane/types";
// ui
import { CircularProgressIndicator } from "@plane/ui";
// helpers
import { getProgress } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useEpicAnalytics } from "@/plane-web/hooks/store";

type TEpicInfoIndicatorItemProps = {
  epicId: string;
};

export const EpicInfoIndicatorItem: FC<TEpicInfoIndicatorItemProps> = observer((props) => {
  const { epicId } = props;
  // hooks
  const { getEpicAnalyticsById } = useEpicAnalytics();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const issue = epicId ? getIssueById(epicId) : undefined;
  const epicAnalytics = getEpicAnalyticsById(epicId);

  if (!issue || !issue.project_id) return <></>;

  // derived values
  const hasSubIssues = (issue?.sub_issues_count ?? 0) > 0;
  const totalIssues = epicAnalytics
    ? Object.values(omit(epicAnalytics, "overdue_issues")).reduce((acc, val) => acc + val, 0)
    : 0;

  const completedIssue = epicAnalytics ? epicAnalytics.completed_issues + epicAnalytics.cancelled_issues : 0;

  const completePercentage = getProgress(completedIssue, totalIssues);

  if (!hasSubIssues) return <></>;
  return (
    <div className="flex-shrink-0">
      <CircularProgressIndicator
        percentage={completePercentage}
        strokeWidth={4}
        size={46}
        strokeColor="stroke-green-500"
      >
        <span className="flex items-baseline justify-center text-sm text-custom-primary-100">
          <span className="font-semibold">{completePercentage}</span>
          <span>%</span>
        </span>
      </CircularProgressIndicator>
    </div>
  );
});
