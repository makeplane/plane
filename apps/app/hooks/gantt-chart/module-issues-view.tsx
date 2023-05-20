import useSWR from "swr";

// services
import modulesService from "services/modules.service";
// fetch-keys
import { MODULE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";

const useGanttChartModuleIssues = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  moduleId: string | undefined
) => {
  // all issues under the workspace and project
  const { data: ganttIssues, mutate: mutateGanttIssues } = useSWR(
    workspaceSlug && projectId && moduleId ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString()) : null,
    workspaceSlug && projectId && moduleId
      ? () =>
          modulesService.getModuleIssuesWithParams(
            workspaceSlug.toString(),
            projectId.toString(),
            moduleId.toString()
          )
      : null
  );

  return {
    ganttIssues,
    mutateGanttIssues,
  };
};

export default useGanttChartModuleIssues;
