"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// ui
import { Tooltip, StateGroupIcon } from "@plane/ui";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useStates } from "@/hooks/store/use-state";

type Props = {
  issueId: string;
};

export const IssueGanttBlock: React.FC<Props> = observer((props) => {
  const { issueId } = props;
  // store hooks
  const { getStateById } = useStates();
  const { getIssueById, setPeekId } = useIssueDetails();
  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails = issueDetails && getStateById(issueDetails.state_id ?? undefined);

  const handleIssuePeekOverview = () => issueDetails && setPeekId(issueDetails.id);
  const { queryParam } = queryParamGenerator({ peekId: issueId });

  return (
    <Link
      id={`issue-${issueId}`}
      href={`?${queryParam}`}
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
        <div className="relative w-full overflow-hidden truncate px-2.5 py-1 text-sm text-custom-text-100">
          {issueDetails?.name}
        </div>
      </Tooltip>
    </Link>
  );
});

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock: React.FC<Props> = observer((props) => {
  const { issueId } = props;
  // router
  const { anchor } = useParams();
  // store hooks
  const { getStateById } = useStates();
  const { project_details } = usePublish(anchor.toString());
  const { getIssueById, setPeekId } = useIssueDetails();
  // derived values
  const issueDetails = getIssueById(issueId);
  const projectIdentifier = project_details?.identifier;
  const stateDetails = issueDetails && getStateById(issueDetails?.state_id ?? undefined);

  const handleIssuePeekOverview = () => issueDetails && setPeekId(issueId);
  const { queryParam } = queryParamGenerator({ peekId: issueId });

  return (
    <Link
      href={`?${queryParam}`}
      onClick={handleIssuePeekOverview}
      className="line-clamp-1 w-full cursor-pointer text-sm text-custom-text-100"
    >
      <div className="relative flex h-full w-full cursor-pointer items-center gap-2">
        {stateDetails && <StateGroupIcon stateGroup={stateDetails?.group} color={stateDetails?.color} />}
        <div className="flex-shrink-0 text-xs text-custom-text-300">
          {projectIdentifier} {issueDetails?.sequence_id}
        </div>
        <Tooltip tooltipContent={issueDetails?.name}>
          <span className="flex-grow truncate text-sm font-medium">{issueDetails?.name}</span>
        </Tooltip>
      </div>
    </Link>
  );
});
