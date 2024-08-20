"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
// ui
import { Tooltip, StateGroupIcon, ControlLink } from "@plane/ui";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { useIssueDetail, useProject, useProjectState } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

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
    getIsIssuePeeked,
    setPeekIssue,
  } = useIssueDetail();
  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails =
    issueDetails && getProjectStates(issueDetails?.project_id)?.find((state) => state?.id == issueDetails?.state_id);

  const handleIssuePeekOverview = () =>
    workspaceSlug &&
    issueDetails &&
    !issueDetails.tempId &&
    issueDetails.project_id &&
    !getIsIssuePeeked(issueDetails.id) &&
    setPeekIssue({ workspaceSlug, projectId: issueDetails.project_id, issueId: issueDetails.id });
  const { isMobile } = usePlatformOS();

  return (
    <div
      id={`issue-${issueId}`}
      className="relative flex h-full w-full cursor-pointer items-center rounded"
      style={{
        backgroundColor: stateDetails?.color,
      }}
      onClick={handleIssuePeekOverview}
    >
      <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        isMobile={isMobile}
        tooltipContent={
          <div className="space-y-1">
            <h5>{issueDetails?.name}</h5>
            <div>
              {renderFormattedDate(issueDetails?.start_date ?? "")} to{" "}
              {renderFormattedDate(issueDetails?.target_date ?? "")}
            </div>
          </div>
        }
        position="top-left"
      >
        <div className="relative w-full overflow-hidden truncate px-2.5 py-1 text-sm text-custom-text-100">
          {issueDetails?.name}
        </div>
      </Tooltip>
    </div>
  );
});

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock: React.FC<Props> = observer((props) => {
  const { issueId } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // store hooks
  const { getStateById } = useProjectState();
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
    setPeekIssue,
  } = useIssueDetail();
  // derived values
  const issueDetails = getIssueById(issueId);
  const projectIdentifier = issueDetails && getProjectIdentifierById(issueDetails?.project_id);
  const stateDetails = issueDetails && getStateById(issueDetails?.state_id);

  const handleIssuePeekOverview = () =>
    workspaceSlug &&
    issueDetails &&
    issueDetails.project_id &&
    setPeekIssue({ workspaceSlug, projectId: issueDetails.project_id, issueId: issueDetails.id });
  const { isMobile } = usePlatformOS();

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issueDetails?.project_id}/issues/${issueDetails?.id}`}
      onClick={handleIssuePeekOverview}
      className="line-clamp-1 w-full cursor-pointer text-sm text-custom-text-100"
      disabled={!!issueDetails?.tempId}
    >
      <div className="relative flex h-full w-full cursor-pointer items-center gap-2">
        {stateDetails && <StateGroupIcon stateGroup={stateDetails?.group} color={stateDetails?.color} />}
        <div className="flex-shrink-0 text-xs text-custom-text-300">
          {projectIdentifier} {issueDetails?.sequence_id}
        </div>
        <Tooltip tooltipContent={issueDetails?.name} isMobile={isMobile}>
          <span className="flex-grow truncate text-sm font-medium">{issueDetails?.name}</span>
        </Tooltip>
      </div>
    </ControlLink>
  );
});
