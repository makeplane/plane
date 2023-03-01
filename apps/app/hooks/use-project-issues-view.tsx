import { useContext } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// contexts
import { issueViewContext } from "contexts/issue-view.context";
// types
import { IIssue } from "types";
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// fetch-keys

const useProjectIssuesView = () => {
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
  const { workspaceSlug, projectId } = router.query;

  let groupedByIssues: {
    [key: string]: IIssue[];
  } = {};

  const params = {
    group_by: groupByProperty,
    order_by: orderBy,
    type: filterIssue,
  };

  const { data: issues } = useSWR(
    PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string, params),
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string, params)
      : null
  );

  if (issues) groupedByIssues = Array.isArray(issues) ? { allIssues: issues } : issues;

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

export default useProjectIssuesView;
