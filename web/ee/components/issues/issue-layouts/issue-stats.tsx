"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { CircularProgressIndicator } from "@plane/ui";
import { getProgress } from "@/helpers/common.helper";
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  issueId: string;
};

export const IssueStats: FC<Props> = observer((props) => {
  const { issueId } = props;

  const { getEpicStatsById } = useIssueTypes();

  const epicStats = getEpicStatsById(issueId);

  const progress = getProgress(epicStats?.completed_issues, epicStats?.total_issues);

  return (
    <>
      {epicStats && epicStats?.total_issues > 0 && (
        <div className="flex items-center gap-1">
          <CircularProgressIndicator size={20} percentage={progress} strokeWidth={3} />
          <span className="text-sm font-medium text-custom-text-300 px-1">{`${progress}%`}</span>
        </div>
      )}
    </>
  );
});
