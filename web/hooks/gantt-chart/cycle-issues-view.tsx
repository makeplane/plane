import useSWR from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useIssuesView from "hooks/use-issues-view";
// fetch-keys
import { CYCLE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";

const useGanttChartCycleIssues = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  cycleId: string | undefined
) => {
  const { displayFilters, filters } = useIssuesView();

  const params: any = {
    order_by: displayFilters.order_by,
    type: displayFilters?.type ? displayFilters?.type : undefined,
    sub_issue: displayFilters.sub_issue,
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    state: filters?.state ? filters?.state.join(",") : undefined,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    start_date: filters?.start_date ? filters?.start_date.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    start_target_date: true, // to fetch only issues with a start and target date
  };

  // all issues under the workspace and project
  const { data: ganttIssues, mutate: mutateGanttIssues } = useSWR(
    workspaceSlug && projectId && cycleId
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params)
      : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cyclesService.getCycleIssuesWithParams(
            workspaceSlug.toString(),
            projectId.toString(),
            cycleId.toString(),
            params
          )
      : null
  );

  return {
    ganttIssues,
    mutateGanttIssues,
  };
};

export default useGanttChartCycleIssues;
