// ui
import { Tooltip, StateGroupIcon, ControlLink } from "@plane/ui";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { TIssue } from "@plane/types";
import { useApplication, useIssueDetail, useProject, useProjectState } from "hooks/store";

export const IssueGanttBlock = ({ data }: { data: TIssue }) => {
  // hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { getProjectStates } = useProjectState();
  const { setPeekIssue } = useIssueDetail();

  const handleIssuePeekOverview = () =>
    workspaceSlug &&
    data &&
    data.project_id &&
    data.id &&
    setPeekIssue({ workspaceSlug, projectId: data.project_id, issueId: data.id });

  const stateColor = getProjectStates(data?.project_id)?.find((state) => state?.id == data?.state_id)?.color || "";

  return (
    <div
      className="relative flex h-full w-full cursor-pointer items-center rounded"
      style={{
        backgroundColor: stateColor,
      }}
      onClick={handleIssuePeekOverview}
    >
      <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        tooltipContent={
          <div className="space-y-1">
            <h5>{data?.name}</h5>
            <div>
              {renderFormattedDate(data?.start_date ?? "")} to {renderFormattedDate(data?.target_date ?? "")}
            </div>
          </div>
        }
        position="top-left"
      >
        <div className="relative w-full truncate px-2.5 py-1 text-sm text-custom-text-100">{data?.name}</div>
      </Tooltip>
    </div>
  );
};

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock = ({ data }: { data: TIssue }) => {
  // hooks
  const { getProjectStates } = useProjectState();
  const { getProjectById } = useProject();
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { setPeekIssue } = useIssueDetail();

  const handleIssuePeekOverview = () =>
    workspaceSlug &&
    data &&
    data.project_id &&
    data.id &&
    setPeekIssue({ workspaceSlug, projectId: data.project_id, issueId: data.id });

  const currentStateDetails =
    getProjectStates(data?.project_id)?.find((state) => state?.id == data?.state_id) || undefined;

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${data.project_id}/issues/${data.id}`}
      target="_blank"
      onClick={handleIssuePeekOverview}
      className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
    >
      <div className="relative flex h-full w-full cursor-pointer items-center gap-2" onClick={handleIssuePeekOverview}>
        {currentStateDetails != undefined && (
          <StateGroupIcon stateGroup={currentStateDetails?.group} color={currentStateDetails?.color} />
        )}
        <div className="flex-shrink-0 text-xs text-custom-text-300">
          {getProjectById(data?.project_id)?.identifier} {data?.sequence_id}
        </div>
        <Tooltip tooltipHeading="Title" tooltipContent={data.name}>
          <span className="flex-grow truncate text-sm font-medium">{data?.name}</span>
        </Tooltip>
      </div>
    </ControlLink>
  );
};
