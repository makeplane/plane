import { useRouter } from "next/router";

// ui
import { Tooltip } from "components/ui";
// icons
import { getStateGroupIcon } from "components/icons";
// helpers
import { findTotalDaysInRange, renderShortDate } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

export const IssueGanttBlock = ({ data }: { data: IIssue }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div
      className="flex items-center relative h-full w-full rounded"
      style={{ backgroundColor: data?.state_detail?.color }}
      onClick={() => router.push(`/${workspaceSlug}/projects/${data?.project}/issues/${data?.id}`)}
    >
      <div className="absolute top-0 left-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        tooltipContent={
          <div className="space-y-1">
            <h5>{data?.name}</h5>
            <div>
              {renderShortDate(data?.start_date ?? "")} to{" "}
              {renderShortDate(data?.target_date ?? "")}
            </div>
          </div>
        }
        position="top-left"
      >
        <div className="relative text-custom-text-100 text-sm truncate py-1 px-2.5 w-full">
          {data?.name}
        </div>
      </Tooltip>
    </div>
  );
};

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock = ({ data }: { data: IIssue }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const duration = findTotalDaysInRange(data?.start_date ?? "", data?.target_date ?? "", true);

  return (
    <div
      className="relative w-full flex items-center gap-2 h-full"
      onClick={() => router.push(`/${workspaceSlug}/projects/${data?.project}/issues/${data?.id}`)}
    >
      {getStateGroupIcon(data?.state_detail?.group, "14", "14", data?.state_detail?.color)}
      <div className="text-xs text-custom-text-300 flex-shrink-0">
        {data?.project_detail?.identifier} {data?.sequence_id}
      </div>
      <div className="flex items-center justify-between gap-2 w-full flex-grow truncate">
        <h6 className="text-sm font-medium flex-grow truncate">{data?.name}</h6>
        <span className="flex-shrink-0 text-sm text-custom-text-200">
          {duration} day{duration > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};
