import useSWR from "swr";

// services
import modulesService from "services/modules.service";
// hooks
import useIssuesView from "hooks/use-issues-view";
// fetch-keys
import { MODULE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";

const useGanttChartModuleIssues = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  moduleId: string | undefined
) => {
  const { orderBy, filters, showSubIssues } = useIssuesView();

  const params: any = {
    order_by: orderBy,
    type: filters?.type ? filters?.type : undefined,
    sub_issue: showSubIssues,
    start_target_date: true,
  };

  // all issues under the workspace and project
  const { data: ganttIssues, mutate: mutateGanttIssues } = useSWR(
    workspaceSlug && projectId && moduleId
      ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), params)
      : null,
    workspaceSlug && projectId && moduleId
      ? () =>
          modulesService.getModuleIssuesWithParams(
            workspaceSlug.toString(),
            projectId.toString(),
            moduleId.toString(),
            params
          )
      : null
  );

  return {
    ganttIssues,
    mutateGanttIssues,
  };
};

export default useGanttChartModuleIssues;
