"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Timer } from "lucide-react";
// helpers
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import { IssueWorklogPropertyButton } from "@/plane-web/components/issues/worklog";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueWorklogProperty: FC<TIssueWorklogProperty> = observer((props) => {
  const { workspaceSlug, projectId, issueId } = props;
  // hooks
  const { issueWorklogTotalMinutes, isWorklogsEnabledByProjectId, getIssueWorklogTotalMinutes } =
    useWorkspaceWorklogs();
  const { peekIssue } = useIssueDetail();

  // fetching current issue total worklog count
  const { isLoading } = useSWR(
    workspaceSlug && projectId && issueId && isWorklogsEnabledByProjectId(projectId)
      ? `ISSUE_DETAIL_WORKLOG_${workspaceSlug}_${projectId}_${issueId}`
      : null,
    workspaceSlug && projectId && issueId && isWorklogsEnabledByProjectId(projectId)
      ? async () => getIssueWorklogTotalMinutes(workspaceSlug, projectId, issueId)
      : null
  );

  // derived values
  const isPeekOverview = peekIssue ? true : false;
  const totalMinutes = issueId && issueWorklogTotalMinutes[issueId] ? issueWorklogTotalMinutes[issueId] : 0;

  if (!isWorklogsEnabledByProjectId(projectId)) return <></>;
  return (
    <div className="flex w-full items-center gap-3 min-h-8">
      <div
        className={`flex items-center gap-1 flex-shrink-0 text-sm text-custom-text-300 ${isPeekOverview ? "w-1/4" : "w-2/5"}`}
      >
        <Timer className="h-4 w-4 flex-shrink-0" />
        <span>Tracked time</span>
      </div>
      <div className="relative h-full min-h-8 w-full flex-grow flex items-center">
        <IssueWorklogPropertyButton
          content={convertMinutesToHoursMinutesString(totalMinutes).trim()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
});
