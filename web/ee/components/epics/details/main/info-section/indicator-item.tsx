"use client";

import { FC } from "react";
import { omit } from "lodash";
import { observer } from "mobx-react";
// constants
import { EIssueServiceType } from "@plane/constants";
// ui
import { CircularProgressIndicator } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TEpicInfoIndicatorItemProps = {
  epicId: string;
};

export const EpicInfoIndicatorItem: FC<TEpicInfoIndicatorItemProps> = observer((props) => {
  const { epicId } = props;
  // hooks
  const { getEpicAnalyticsById } = useIssueTypes();
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

  const completePercentage = epicAnalytics
    ? Math.round(((epicAnalytics.completed_issues + epicAnalytics.cancelled_issues) / totalIssues) * 100)
    : 0;
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
