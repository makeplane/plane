import { useContext } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import modulesService from "services/modules.service";
// contexts
import { issueViewContext } from "contexts/issue-view.context";
// types
import { IIssue } from "types";
// fetch-keys
import { MODULE_ISSUES } from "constants/fetch-keys";

const useModuleIssuesView = () => {
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
  const { workspaceSlug, projectId, moduleId } = router.query;

  let groupedByIssues: {
    [key: string]: IIssue[];
  } = {};

  const { data: moduleIssues } = useSWR(
    MODULE_ISSUES(moduleId as string),
    workspaceSlug && projectId
      ? () =>
          modulesService.getModuleIssues(
            workspaceSlug as string,
            projectId as string,
            moduleId as string,
            {
              group_by: groupByProperty,
              order_by: orderBy,
              type: filterIssue,
            }
          )
      : null
  );

  groupedByIssues = Array.isArray(moduleIssues) ? { allIssues: moduleIssues } : moduleIssues;

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

export default useModuleIssuesView;
