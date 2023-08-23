import Link from "next/link";
import { useRouter } from "next/router";

// ui
import { Tooltip } from "components/ui";
// icons
import { getStateGroupIcon } from "components/icons";
// helpers
import { findTotalDaysInRange, renderShortDate } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

export const IssueGanttBlock = ({ issue }: { issue: IIssue }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Link href={`/${workspaceSlug}/projects/${issue?.project}/issues/${issue?.id}`}>
      <a
        className="flex items-center relative h-full w-full rounded"
        style={{ backgroundColor: issue?.state_detail?.color }}
      >
        <div className="absolute top-0 left-0 h-full w-full bg-custom-background-100/50" />
        <Tooltip
          tooltipContent={
            <div className="space-y-1">
              <h5>{issue?.name}</h5>
              <div>
                {renderShortDate(issue?.start_date ?? "")} to{" "}
                {renderShortDate(issue?.target_date ?? "")}
              </div>
            </div>
          }
          position="top-left"
        >
          <div className="relative text-custom-text-100 text-sm truncate py-1 px-2.5 w-full">
            {issue?.name}
          </div>
        </Tooltip>
      </a>
    </Link>
  );
};

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock = ({ issue }: { issue: IIssue }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const duration = findTotalDaysInRange(issue?.start_date ?? "", issue?.target_date ?? "", true);

  return (
    <Link href={`/${workspaceSlug}/projects/${issue?.project}/issues/${issue?.id}`}>
      <a className="relative w-full flex items-center gap-2 h-full">
        {getStateGroupIcon(issue?.state_detail?.group, "14", "14", issue?.state_detail?.color)}
        <div className="text-xs text-custom-text-300 flex-shrink-0">
          {issue?.project_detail?.identifier} {issue?.sequence_id}
        </div>
        <div className="flex items-center justify-between gap-2 w-full flex-grow truncate">
          <h6 className="text-sm font-medium flex-grow truncate">{issue?.name}</h6>
          <span className="flex-shrink-0 text-sm text-custom-text-200">
            {duration} day{duration > 1 ? "s" : ""}
          </span>
        </div>
      </a>
    </Link>
  );
};
