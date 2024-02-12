import { observer } from "mobx-react";
// hooks
import { useApplication, useIssueDetail, useProject, useProjectState } from "hooks/store";
// ui
import { Tooltip, StateGroupIcon, ControlLink } from "@plane/ui";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";

type Props = {
  issueId: string;
};

export const IssueGanttBlock: React.FC<Props> = observer((props) => {
  const { issueId } = props;
  // store hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { getProjectStates } = useProjectState();
  const {
    issue: { getIssueById },
    setPeekIssue,
  } = useIssueDetail();
  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails =
    issueDetails && getProjectStates(issueDetails?.project_id)?.find((state) => state?.id == issueDetails?.state_id);

  const handleIssuePeekOverview = () =>
    workspaceSlug &&
    issueDetails &&
    setPeekIssue({ workspaceSlug, projectId: issueDetails.project_id, issueId: issueDetails.id });

  return (
    <div
      className="relative flex h-full w-full cursor-pointer items-center rounded"
      style={{
        backgroundColor: stateDetails?.color,
      }}
      onClick={handleIssuePeekOverview}
    >
      <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
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
        <div className="relative w-full truncate px-2.5 py-1 text-sm text-custom-text-100 overflow-hidden">
          {issueDetails?.name}
        </div>
      </Tooltip>
    </div>
  );
});

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock: React.FC<Props> = observer((props) => {
  const { issueId } = props;
  // store hooks
  const { getStateById } = useProjectState();
  const { getProjectById } = useProject();
  const {
    router: { workspaceSlug },
  } = useApplication();
  const {
    issue: { getIssueById },
    setPeekIssue,
  } = useIssueDetail();
  // derived values
  const issueDetails = getIssueById(issueId);
  const projectDetails = issueDetails && getProjectById(issueDetails?.project_id);
  const stateDetails = issueDetails && getStateById(issueDetails?.state_id);

  const handleIssuePeekOverview = () =>
    workspaceSlug &&
    issueDetails &&
    setPeekIssue({ workspaceSlug, projectId: issueDetails.project_id, issueId: issueDetails.id });

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issueDetails?.project_id}/issues/${issueDetails?.id}`}
      target="_blank"
      onClick={handleIssuePeekOverview}
      className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
    >
      <div className="relative flex h-full w-full cursor-pointer items-center gap-2" onClick={handleIssuePeekOverview}>
        {stateDetails && <StateGroupIcon stateGroup={stateDetails?.group} color={stateDetails?.color} />}
        <div className="flex-shrink-0 text-xs text-custom-text-300">
          {projectDetails?.identifier} {issueDetails?.sequence_id}
        </div>
        <Tooltip tooltipHeading="Title" tooltipContent={issueDetails?.name}>
          <span className="flex-grow truncate text-sm font-medium">{issueDetails?.name}</span>
        </Tooltip>
      </div>
    </ControlLink>
  );
});
