import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// fetch-keys
import { PROJECT_ISSUES_LIST_WITH_PARAMS } from "constants/fetch-keys";

const useGanttChartIssues = (workspaceSlug: string | undefined, projectId: string | undefined) => {
  // all issues under the workspace and project
  const { data: ganttIssues, mutate: mutateGanttIssues } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_LIST_WITH_PARAMS(projectId) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssuesWithParams(workspaceSlug.toString(), projectId.toString())
      : null
  );

  return {
    ganttIssues,
    mutateGanttIssues,
  };
};

export default useGanttChartIssues;
