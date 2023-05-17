import useSWR from "swr";
// services
import issuesService from "services/issues.service";

const useGanttChartIssues = (workspaceSlug: string | undefined, projectId: string | undefined) => {
  // all issues under the workspace and project
  const { data: ganttIssues, mutate: mutateGanttIssues } = useSWR(
    workspaceSlug && projectId ? `GANTT_CHART_ISSUES_${workspaceSlug}_${projectId}` : null,
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
