import { useContext } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import cyclesService from "services/cycles.service";
// contexts
import { issueViewContext } from "contexts/issue-view.context";
// types
import { IIssue } from "types";
// fetch-keys
import { CYCLE_ISSUES } from "constants/fetch-keys";

const useCycleIssuesView = () => {
  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    filterIssue,
    setFilterIssue,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueViewToKanban,
    setIssueViewToList,
  } = useContext(issueViewContext);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  let groupedByIssues: {
    [key: string]: IIssue[];
  } = {};

  const params = {
    group_by: groupByProperty,
    order_by: orderBy,
    type: filterIssue,
  };

  const { data: cycleIssues } = useSWR(
    CYCLE_ISSUES(cycleId as string, params),
    workspaceSlug && projectId
      ? () =>
          cyclesService.getCycleIssues(
            workspaceSlug as string,
            projectId as string,
            cycleId as string,
            params
          )
      : null
  );

  if (cycleIssues) {
    if (Array.isArray(cycleIssues))
      groupedByIssues = {
        allIssues: cycleIssues?.map((issue) => ({
          ...issue.issue_detail,
          sub_issues_count: issue.sub_issues_count,
          bridge: issue.id,
          cycle: cycleId as string,
        })),
      };
    else
      groupedByIssues = Object.keys(cycleIssues).map((key) => {
        cycleIssues[key].map((issue) => ({
          ...issue.issue_detail,
          sub_issues_count: issue.sub_issues_count,
          bridge: issue.id,
          cycle: cycleId as string,
        }));
      });
  }

  return {
    groupedByIssues,
    issueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    filterIssue,
    setFilterIssue,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueViewToKanban,
    setIssueViewToList,
  } as const;
};

export default useCycleIssuesView;
