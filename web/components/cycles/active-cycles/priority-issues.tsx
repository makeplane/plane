import { FC } from "react";
import Link from "next/link";
// ui
import { Tooltip, Loader, PriorityIcon } from "@plane/ui";
// icons
import { CalendarCheck } from "lucide-react";
// types
import { ICycle } from "@plane/types";
// components
import { StateDropdown } from "components/dropdowns";
// helpers
import { renderFormattedDate, renderFormattedDateWithoutYear } from "helpers/date-time.helper";

export type ActiveCyclePriorityIssuesProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle;
};

export const ActiveCyclePriorityIssues: FC<ActiveCyclePriorityIssuesProps> = (props) => {
  const { workspaceSlug, projectId, cycle } = props;

  const cycleIssues = cycle.issues ?? [];

  return (
    <div className="flex flex-col gap-4 px-3 pt-2 min-h-52 overflow-hidden col-span-1 lg:col-span-2 xl:col-span-1 border-t border-custom-border-300">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-medium">Priority</h3>
      </div>
      <div className="flex flex-col gap-4 h-full w-full max-h-40 overflow-y-auto pb-3">
        {cycleIssues ? (
          cycleIssues.length > 0 ? (
            cycleIssues.map((issue: any) => (
              <Link
                key={issue.id}
                href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-custom-border-200 px-3 py-1.5"
              >
                <div className="flex items-center gap-1.5 flex-grow w-full truncate">
                  <PriorityIcon priority={issue.priority} withContainer size={12} />
                  <Tooltip
                    tooltipHeading="Issue ID"
                    tooltipContent={`${cycle.project_detail?.identifier}-${issue.sequence_id}`}
                  >
                    <span className="flex-shrink-0 text-xs text-custom-text-200">
                      {cycle.project_detail?.identifier}-{issue.sequence_id}
                    </span>
                  </Tooltip>
                  <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
                    <span className="text-[0.825rem] text-custom-text-100 truncate">{issue.name}</span>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StateDropdown
                    value={issue.state_id ?? undefined}
                    onChange={() => {}}
                    projectId={projectId?.toString() ?? ""}
                    disabled={true}
                    buttonVariant="background-with-text"
                  />
                  {issue.target_date && (
                    <Tooltip tooltipHeading="Target Date" tooltipContent={renderFormattedDate(issue.target_date)}>
                      <div className="h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80 cursor-not-allowed">
                        <CalendarCheck className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs">{renderFormattedDateWithoutYear(issue.target_date)}</span>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-custom-text-200">
              <span>There are no high priority issues present in this cycle.</span>
            </div>
          )
        ) : (
          <Loader className="space-y-3">
            <Loader.Item height="50px" />
            <Loader.Item height="50px" />
            <Loader.Item height="50px" />
          </Loader>
        )}
      </div>
    </div>
  );
};
