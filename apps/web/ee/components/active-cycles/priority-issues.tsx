import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { CalendarCheck } from "lucide-react";
// plane imports
import { PriorityIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssuesStoreType, IActiveCycle } from "@plane/types";
import { Loader } from "@plane/ui";
import { generateWorkItemLink, renderFormattedDate, renderFormattedDateWithoutYear } from "@plane/utils";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// constants
import { CYCLE_ISSUES_WITH_PARAMS } from "@/constants/fetch-keys";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

export type ActiveCyclePriorityIssuesProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: IActiveCycle;
};

export const ActiveCyclePriorityIssues: FC<ActiveCyclePriorityIssuesProps> = observer((props) => {
  const { workspaceSlug, projectId, cycle } = props;
  // store hooks
  const {
    issues: { fetchActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { fetchWorkspaceStates } = useProjectState();
  const { getProjectIdentifierById } = useProject();

  // derived values
  const projectIdentifier = getProjectIdentifierById(projectId);

  const { data: activeCycleIssues } = useSWR(
    workspaceSlug && projectId && cycle.id ? CYCLE_ISSUES_WITH_PARAMS(cycle.id, { priority: "urgent,high" }) : null,
    workspaceSlug && projectId && cycle.id
      ? () => fetchActiveCycleIssues(workspaceSlug, projectId, 10, cycle.id)
      : null,
    {
      revalidateOnFocus: false,
    }
  );

  useSWR(
    workspaceSlug ? `WORKSPACE_STATES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceStates(workspaceSlug.toString()) : null
  );

  return (
    <div className="flex flex-col gap-4 p-4 min-h-52 overflow-hidden col-span-1 lg:col-span-2 xl:col-span-1 border border-custom-border-200 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg text-custom-text-300 font-medium">High-priority work items</h3>
      </div>
      <div className="flex flex-col gap-1 h-full w-full max-h-40 overflow-y-auto">
        {activeCycleIssues ? (
          activeCycleIssues.count > 0 && Array.isArray(activeCycleIssues.results) ? (
            activeCycleIssues.results.map((issue: any) => (
              <Link
                key={issue.id}
                href={generateWorkItemLink({
                  workspaceSlug,
                  projectId: issue?.project_id,
                  issueId: issue?.id,
                  projectIdentifier,
                  sequenceId: issue?.sequence_id,
                })}
                className="group flex cursor-pointer items-center justify-between gap-2 rounded-md hover:bg-custom-background-90 p-1"
              >
                <div className="flex items-center gap-1.5 flex-grow w-full truncate">
                  <IssueIdentifier
                    issueId={issue.id}
                    projectId={projectId}
                    textContainerClassName="text-xs text-custom-text-200"
                  />
                  <Tooltip position="top-start" tooltipHeading="Title" tooltipContent={issue.name}>
                    <span className="text-[0.825rem] text-custom-text-100 truncate">{issue.name}</span>
                  </Tooltip>
                </div>
                <PriorityIcon priority={issue.priority} withContainer size={12} />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StateDropdown
                    value={issue.state_id ?? undefined}
                    onChange={() => {}}
                    projectId={projectId?.toString() ?? ""}
                    buttonVariant="background-with-text"
                    buttonContainerClassName="cursor-pointer"
                    buttonClassName="group-hover:bg-custom-background-100"
                  />
                  {issue.target_date && (
                    <Tooltip tooltipHeading="Target Date" tooltipContent={renderFormattedDate(issue.target_date)}>
                      <div className="h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80 group-hover:bg-custom-background-100 cursor-pointer">
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
              <span>There are no high priority work items present in this cycle.</span>
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
});
