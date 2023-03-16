import { useContext, useMemo } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// contexts
import { issueViewContext } from "contexts/issue-view.context";
// services
import issuesService from "services/issues.service";
import cyclesService from "services/cycles.service";
import modulesService from "services/modules.service";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  VIEW_ISSUES,
} from "constants/fetch-keys";

// types
import type { IIssue } from "types";
import viewsService from "services/views.service";

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
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const params: any = {
    order_by: orderBy,
    group_by: groupByProperty,
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    state: filters?.state ? filters?.state.join(",") : undefined,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    type: filters?.type ? filters?.type : undefined,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    issue__assignees__id: filters?.issue__assignees__id
      ? filters?.issue__assignees__id.join(",")
      : undefined,
    issue__labels__id: filters?.issue__labels__id
      ? filters?.issue__labels__id.join(",")
      : undefined,
  };

  const { data: projectIssues } = useSWR(
    workspaceSlug && projectId && params
      ? PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string)
      : null,
    workspaceSlug && projectId && params
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug as string, projectId as string, params)
      : null
  );

  const { data: viewIssues } = useSWR(
    workspaceSlug && projectId && viewId ? VIEW_ISSUES(viewId as string) : null,
    workspaceSlug && projectId && viewId
      ? () =>
          viewsService.getViewIssues(workspaceSlug as string, projectId as string, viewId as string)
      : null
  );

  const { data: cycleIssues } = useSWR(
    workspaceSlug && projectId && cycleId && params
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId as string)
      : null,
    workspaceSlug && projectId && cycleId && params
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
    workspaceSlug && projectId && moduleId && params
      ? MODULE_ISSUES_WITH_PARAMS(moduleId as string)
      : null,
    workspaceSlug && projectId && moduleId && params
      ? () =>
          modulesService.getModuleIssuesWithParams(
            workspaceSlug as string,
            projectId as string,
            moduleId as string,
            params
          )
      : null
  );

  const groupedByIssues:
    | {
        [key: string]: IIssue[];
      }
    | undefined = useMemo(() => {
    const issuesToGroup = viewIssues ?? cycleIssues ?? moduleIssues ?? projectIssues;

    if (Array.isArray(issuesToGroup)) return { allIssues: issuesToGroup };
    else return issuesToGroup;
  }, [projectIssues, cycleIssues, moduleIssues, viewIssues]);

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
