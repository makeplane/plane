import { useRouter } from "next/router";
// ui
import { Tooltip, StateGroupIcon } from "@plane/ui";
// helpers
import { renderShortDate } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

export const IssueGanttBlock = ({ data }: { data: IIssue }) => {
  const router = useRouter();

  const handleIssuePeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssueId: data?.id, peekProjectId: data?.project },
    });
  };

  return (
    <div
      className="relative flex h-full w-full cursor-pointer items-center rounded"
      style={{ backgroundColor: data?.state_detail?.color }}
      onClick={handleIssuePeekOverview}
    >
      <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        tooltipContent={
          <div className="space-y-1">
            <h5>{data?.name}</h5>
            <div>
              {renderShortDate(data?.start_date ?? "")} to {renderShortDate(data?.target_date ?? "")}
            </div>
          </div>
        }
        position="top-left"
      >
        <Tooltip tooltipHeading="Title" tooltipContent={data.name}>
          <div className="relative w-full truncate px-2.5 py-1 text-sm text-custom-text-100">{data?.name}</div>
        </Tooltip>
      </Tooltip>
    </div>
  );
};

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock = ({ data }: { data: IIssue }) => {
  const router = useRouter();

  const handleIssuePeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssueId: data?.id, peekProjectId: data?.project },
    });
  };

  return (
    <div className="relative flex h-full w-full cursor-pointer items-center gap-2" onClick={handleIssuePeekOverview}>
      <StateGroupIcon stateGroup={data?.state_detail?.group} color={data?.state_detail?.color} />
      <div className="flex-shrink-0 text-xs text-custom-text-300">
        {data?.project_detail?.identifier} {data?.sequence_id}
      </div>
      <Tooltip tooltipHeading="Title" tooltipContent={data.name}>
        <span className="flex-grow truncate text-sm font-medium">{data?.name}</span>
      </Tooltip>
    </div>
  );
};
