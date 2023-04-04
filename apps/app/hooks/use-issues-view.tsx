import { useContext, useMemo } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// contexts
import { issueViewContext } from "contexts/issue-view.context";
// services
import issuesService from "services/issues.service";
import cyclesService from "services/cycles.service";
import modulesService from "services/modules.service";
import stateService from "services/state.service";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import type { IIssue } from "types";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  STATE_LIST,
} from "constants/fetch-keys";

const useIssuesView = () => {
  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    showEmptyGroups,
    setShowEmptyGroups,
    filters,
    setFilters,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueView,
  } = useContext(issueViewContext);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

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
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
  };

  const { data: projectIssues } = useSWR(
    workspaceSlug && projectId && params
      ? PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params)
      : null,
    workspaceSlug && projectId && params
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug as string, projectId as string, params)
      : null
  );

  const { data: cycleIssues } = useSWR(
    workspaceSlug && projectId && cycleId && params
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params)
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
      ? MODULE_ISSUES_WITH_PARAMS(moduleId as string, params)
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

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const statesList = getStatesList(states ?? {});
  const stateIds = statesList.map((state) => state.id);

  const emptyStatesObject: { [key: string]: [] } = {};
  for (let i = 0; i < stateIds.length; i++) {
    emptyStatesObject[stateIds[i]] = [];
  }

  const groupedByIssues:
    | {
        [key: string]: IIssue[];
      }
    | undefined = useMemo(() => {
    const issuesToGroup = cycleId ? cycleIssues : moduleId ? moduleIssues : projectIssues;

    if (Array.isArray(issuesToGroup)) return { allIssues: issuesToGroup };
    if (groupByProperty === "state")
      return issuesToGroup ? Object.assign(emptyStatesObject, issuesToGroup) : undefined;

    return issuesToGroup;
  }, [
    projectIssues,
    cycleIssues,
    moduleIssues,
    groupByProperty,
    cycleId,
    moduleId,
    emptyStatesObject,
  ]);

  const isEmpty =
    Object.values(groupedByIssues ?? {}).every((group) => group.length === 0) ||
    Object.keys(groupedByIssues ?? {}).length === 0;

  return {
    groupedByIssues,
    issueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    showEmptyGroups,
    setShowEmptyGroups,
    filters,
    setFilters,
    params,
    isNotEmpty: !isEmpty,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueView,
  } as const;
};

export default useIssuesView;
