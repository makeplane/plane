import { useContext, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import issuesService from "services/issues.service";
// contexts
import { issueViewContext } from "contexts/issue-view.context";
// types
import { IIssue } from "types";
// fetch-keys

const useIssueView = (projectIssues: IIssue[]) => {
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

  const { data: newIssues } = useSWR(
    "KUCHH BHI",
    workspaceSlug && projectId
      ? () =>
          issuesService.getNewIssues(workspaceSlug as string, projectId as string, {
            group_by: groupByProperty,
            order_by: orderBy,
            type: filterIssue,
          })
      : null
  );

  groupedByIssues = Array.isArray(newIssues) ? { noGroup: newIssues } : newIssues;

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

export default useIssueView;
