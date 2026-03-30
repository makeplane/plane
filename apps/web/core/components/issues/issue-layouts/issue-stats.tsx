/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { CircularProgressIndicator } from "@plane/ui";
import { cn, getProgress } from "@plane/utils";
import { useEpicAnalytics } from "@/plane-web/hooks/store";

type Props = {
  issueId: string;
  className?: string;
  size?: number;
  showProgressText?: boolean;
  showLabel?: boolean;
};

export const IssueStats = observer(function IssueStats(props: Props) {
  const { issueId, className, size = 14, showProgressText = true, showLabel = false } = props;

  const { getEpicStatsById } = useEpicAnalytics();

  const epicStats = getEpicStatsById(issueId);

  const completedIssues = epicStats?.completed_issues ?? 0;
  const totalIssues = epicStats?.total_issues ?? 0;
  const adjustedTotalIssues = Math.max(totalIssues - (epicStats?.cancelled_issues ?? 0), 0);
  const progress = getProgress(epicStats?.completed_issues, totalIssues, epicStats?.cancelled_issues);

  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <CircularProgressIndicator size={size} percentage={progress} strokeWidth={3} />
      <div className="text-11 my-auto w-auto overflow-hidden truncate ">
        {showProgressText ? (adjustedTotalIssues ? `${completedIssues}/${adjustedTotalIssues}` : `0/0`) : ""}{" "}
        {showLabel && `Work items`}
      </div>
    </div>
  );
});
