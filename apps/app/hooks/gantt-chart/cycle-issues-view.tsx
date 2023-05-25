import useSWR from "swr";

// services
import cyclesService from "services/cycles.service";
// fetch-keys
import { CYCLE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";

const useGanttChartCycleIssues = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  cycleId: string | undefined
) => {
  // all issues under the workspace and project
  const { data: ganttIssues, mutate: mutateGanttIssues } = useSWR(
    workspaceSlug && projectId && cycleId ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString()) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cyclesService.getCycleIssuesWithParams(
            workspaceSlug.toString(),
            projectId.toString(),
            cycleId.toString()
          )
      : null
  );

  return {
    ganttIssues,
    mutateGanttIssues,
  };
};

export default useGanttChartCycleIssues;
