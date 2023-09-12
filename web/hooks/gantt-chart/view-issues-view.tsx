import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// hooks
import useIssuesView from "hooks/use-issues-view";
// fetch-keys
import { VIEW_ISSUES } from "constants/fetch-keys";

const useGanttChartViewIssues = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  viewId: string | undefined
) => {
  const { params } = useIssuesView();
  const { order_by, group_by, ...viewGanttParams } = params;

  // all issues under the view
  const { data: ganttIssues, mutate: mutateGanttIssues } = useSWR(
    workspaceSlug && projectId && viewId
      ? VIEW_ISSUES(viewId.toString(), { ...viewGanttParams, order_by, start_target_date: true })
      : null,
    workspaceSlug && projectId && viewId
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug.toString(), projectId.toString(), {
            ...viewGanttParams,
            start_target_date: true,
          })
      : null
  );

  return {
    ganttIssues,
    mutateGanttIssues,
  };
};

export default useGanttChartViewIssues;
