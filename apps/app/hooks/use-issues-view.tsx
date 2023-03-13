import { useContext, useMemo } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// contexts
import { issueViewContext } from "contexts/issue-view.context";
// services
import issuesService from "services/issues.service";
import cyclesService from "services/cycles.service";
import modulesService from "services/modules.service";
// types
import { IIssueViewOptions } from "types";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
} from "constants/fetch-keys";

const useIssuesView = () => {
  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    filters,
    setFilters,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueViewToKanban,
    setIssueViewToList,
  } = useContext(issueViewContext);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const params: any = {
    group_by: groupByProperty,
    order_by: orderBy,
    ...filters,
  };

  const { data: projectIssues } = useSWR(
    PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string),
    workspaceSlug && projectId
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug as string, projectId as string, params)
      : null
  );

  const { data: cycleIssues } = useSWR(
    cycleId ? CYCLE_ISSUES_WITH_PARAMS(cycleId as string) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cyclesService.getCycleIssuesWithParams(
            workspaceSlug as string,
            projectId as string,
            cycleId as string,
            params
          )
      : null
  );

  const { data: moduleIssues } = useSWR(
    cycleId ? MODULE_ISSUES_WITH_PARAMS(moduleId as string) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          modulesService.getModuleIssuesWithParams(
            workspaceSlug as string,
            projectId as string,
            moduleId as string,
            params
          )
      : null
  );

  const groupedByIssues: any = useMemo(() => {
    const issuesToGroup = cycleIssues ?? moduleIssues ?? projectIssues;

    if (Array.isArray(issuesToGroup)) return { allIssues: issuesToGroup };
    else return issuesToGroup;
  }, [projectIssues, cycleIssues, moduleIssues]);

  // console.log("Grouped by issues: ", groupedByIssues);

  return {
    groupedByIssues,
    issueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    filters,
    setFilters,
    params,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueViewToKanban,
    setIssueViewToList,
  } as const;
};

export default useIssuesView;
