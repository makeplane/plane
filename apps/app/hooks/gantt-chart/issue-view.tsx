import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// hooks
import useIssuesView from "hooks/use-issues-view";
// fetch-keys
import { PROJECT_ISSUES_LIST_WITH_PARAMS } from "constants/fetch-keys";

const useGanttChartIssues = (workspaceSlug: string | undefined, projectId: string | undefined) => {
  const { orderBy, filters, showSubIssues } = useIssuesView();

  const params: any = {
    order_by: orderBy,
    type: filters?.type ? filters?.type : undefined,
    sub_issue: showSubIssues,
    start_target_date: true,
  };

  // all issues under the workspace and project
  const { data: ganttIssues, mutate: mutateGanttIssues } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_LIST_WITH_PARAMS(projectId, params) : null,
    workspaceSlug && projectId
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug.toString(), projectId.toString(), params)
      : null
  );

  return {
    ganttIssues,
    mutateGanttIssues,
  };
};

export default useGanttChartIssues;
