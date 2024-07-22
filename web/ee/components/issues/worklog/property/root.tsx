"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Timer } from "lucide-react";
import { Popover } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { convertMinutesToDaysHoursMinutes } from "@/helpers/date-time.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import { IssueWorklogPropertyButton, WorklogCreate } from "@/plane-web/components/issues/worklog";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueWorklogProperty: FC<TIssueWorklogProperty> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // hooks
  const { issueWorklogTotalMinutes, isWorklogsEnabledByProjectId, getIssueWorklogTotalMinutes } =
    useWorkspaceWorklogs();
  const { peekIssue } = useIssueDetail();
  // ref
  const popoverButtonRef = useRef<HTMLButtonElement | null>(null);

  // fetching current issue total worklog count
  useSWR(
    workspaceSlug && projectId && issueId ? `ISSUE_DETAIL_WORKLOG_${workspaceSlug}_${projectId}_${issueId}` : null,
    workspaceSlug && projectId && issueId
      ? async () => getIssueWorklogTotalMinutes(workspaceSlug, projectId, issueId)
      : null
  );

  // derived values
  const isPeekOverview = peekIssue ? true : false;
  const totalMinutes = issueId && issueWorklogTotalMinutes[issueId] ? issueWorklogTotalMinutes[issueId] : 0;

  if (isWorklogsEnabledByProjectId(projectId)) return <></>;
  return (
    <div className="flex w-full items-center gap-3 min-h-8">
      <div
        className={`flex items-center gap-1 flex-shrink-0 text-sm text-custom-text-300 ${isPeekOverview ? "w-1/4" : "w-2/5 pt-2"}`}
      >
        <Timer className="h-4 w-4 flex-shrink-0" />
        <span>Time Tracking</span>
      </div>
      <div className="relative h-full min-h-8 w-full flex-grow flex items-center">
        <Popover
          popoverButtonRef={popoverButtonRef}
          disabled={disabled}
          buttonClassName={cn("w-full outline-none", { "cursor-not-allowed": disabled })}
          button={
            <IssueWorklogPropertyButton content={convertMinutesToDaysHoursMinutes(totalMinutes)} disabled={disabled} />
          }
          popperPosition="bottom-end"
          panelClassName="w-72 my-1 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 p-3 text-xs shadow-custom-shadow-rg focus:outline-none"
        >
          <WorklogCreate
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            handleClose={() => popoverButtonRef.current?.click()}
          />
        </Popover>
      </div>
    </div>
  );
});
