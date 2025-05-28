"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { CircularProgressIndicator } from "@plane/ui";
import { cn } from "@plane/utils";
import { getProgress } from "@/helpers/common.helper";
import { useEpicAnalytics } from "@/plane-web/hooks/store";

type Props = {
  issueId: string;
  className?: string;
  size?: number;
  showProgressText?: boolean;
  showLabel?: boolean;
};

export const IssueStats: FC<Props> = observer((props) => {
  const { issueId, className, size = 14, showProgressText = true, showLabel = false } = props;

  const { getEpicStatsById } = useEpicAnalytics();

  const epicStats = getEpicStatsById(issueId);

  const completedIssues = epicStats ? epicStats.completed_issues + epicStats.cancelled_issues : 0;

  const progress = getProgress(completedIssues, epicStats?.total_issues);

  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <CircularProgressIndicator size={size} percentage={progress} strokeWidth={3} />
      <div className="text-xs my-auto w-auto overflow-hidden truncate ">
        {showProgressText ? (epicStats?.total_issues ? `${completedIssues}/${epicStats?.total_issues}` : `0/0`) : ""}{" "}
        {showLabel && `Work items`}
      </div>
    </div>
  );
});
