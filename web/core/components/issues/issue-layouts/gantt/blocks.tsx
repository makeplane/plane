"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Tooltip, ControlLink } from "@plane/ui";
// components
import { SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useIssueDetail, useIssues, useProjectState } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
//
import { getBlockViewDetails } from "../utils";
import { GanttStoreType } from "./base-gantt-root";

type Props = {
  issueId: string;
};

export const IssueGanttBlock: React.FC<Props> = observer((props) => {
  const { issueId } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // store hooks
  const { getProjectStates } = useProjectState();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // hooks
  const { isMobile } = usePlatformOS();
  const { handleRedirection } = useIssuePeekOverviewRedirection();

  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails =
    issueDetails && getProjectStates(issueDetails?.project_id)?.find((state) => state?.id == issueDetails?.state_id);

  const { message, blockStyle } = getBlockViewDetails(issueDetails, stateDetails?.color ?? "");

  const handleIssuePeekOverview = () => handleRedirection(workspaceSlug, issueDetails, isMobile);

  return (
    <Tooltip
      isMobile={isMobile}
      tooltipContent={
        <div className="space-y-1">
          <h5>{issueDetails?.name}</h5>
          <div>{message}</div>
        </div>
      }
      position="top-left"
      disabled={!message}
    >
      <div
        id={`issue-${issueId}`}
        className="relative flex h-full w-full cursor-pointer items-center rounded"
        style={blockStyle}
        onClick={handleIssuePeekOverview}
      >
        <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
        <div
          className="sticky w-auto overflow-hidden truncate px-2.5 py-1 text-sm text-custom-text-100"
          style={{ left: `${SIDEBAR_WIDTH}px` }}
        >
          {issueDetails?.name}
        </div>
      </div>
    </Tooltip>
  );
});

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock: React.FC<Props> = observer((props) => {
  const { issueId } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { isMobile } = usePlatformOS();
  const storeType = useIssueStoreType() as GanttStoreType;
  const { issuesFilter } = useIssues(storeType);

  // handlers
  const { handleRedirection } = useIssuePeekOverviewRedirection();

  // derived values
  const issueDetails = getIssueById(issueId);

  const handleIssuePeekOverview = (e: any) => {
    e.stopPropagation(true);
    e.preventDefault();
    handleRedirection(workspaceSlug, issueDetails, isMobile);
  };

  return (
    <ControlLink
      id={`issue-${issueId}`}
      href={`/${workspaceSlug}/projects/${issueDetails?.project_id}/issues/${issueDetails?.id}`}
      onClick={handleIssuePeekOverview}
      className="line-clamp-1 w-full cursor-pointer text-sm text-custom-text-100"
      disabled={!!issueDetails?.tempId}
    >
      <div className="relative flex h-full w-full cursor-pointer items-center gap-2">
        {issueDetails?.project_id && (
          <IssueIdentifier
            issueId={issueDetails.id}
            projectId={issueDetails.project_id}
            textContainerClassName="text-xs text-custom-text-300"
            displayProperties={issuesFilter?.issueFilters?.displayProperties}
          />
        )}
        <Tooltip tooltipContent={issueDetails?.name} isMobile={isMobile}>
          <span className="flex-grow truncate text-sm font-medium">{issueDetails?.name}</span>
        </Tooltip>
      </div>
    </ControlLink>
  );
});
