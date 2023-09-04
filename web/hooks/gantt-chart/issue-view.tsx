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
