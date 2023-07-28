import { useContext } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// contexts
import { issueViewContext } from "contexts/issue-view.context";
// services
import issuesService from "services/issues.service";
import cyclesService from "services/cycles.service";
import modulesService from "services/modules.service";
// types
import { IIssue } from "types";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  VIEW_ISSUES,
} from "constants/fetch-keys";

const useCalendarIssuesView = () => {
  const {
    issueView,
    calendarDateRange,
    setCalendarDateRange,
    filters,
    setFilters,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueView,
  } = useContext(issueViewContext);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const params: any = {
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    state: filters?.state ? filters?.state.join(",") : undefined,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    type: filters?.type ? filters?.type : undefined,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    target_date: calendarDateRange,
  };

  const { data: projectCalendarIssues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params)
      : null,
    workspaceSlug && projectId
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug.toString(), projectId.toString(), params)
      : null
  );

  const { data: cycleCalendarIssues } = useSWR(
    workspaceSlug && projectId && cycleId
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params)
      : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cyclesService.getCycleIssuesWithParams(
            workspaceSlug.toString(),
            projectId.toString(),
            cycleId.toString(),
            params
          )
      : null
  );

  const { data: moduleCalendarIssues } = useSWR(
    workspaceSlug && projectId && moduleId
      ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), params)
      : null,
    workspaceSlug && projectId && moduleId
      ? () =>
          modulesService.getModuleIssuesWithParams(
            workspaceSlug.toString(),
            projectId.toString(),
            moduleId.toString(),
            params
          )
      : null
  );

  const { data: viewCalendarIssues } = useSWR(
    workspaceSlug && projectId && viewId && params ? VIEW_ISSUES(viewId.toString(), params) : null,
    workspaceSlug && projectId && viewId && params
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug.toString(), projectId.toString(), params)
      : null
  );

  const calendarIssues = cycleId
    ? (cycleCalendarIssues as IIssue[])
    : moduleId
    ? (moduleCalendarIssues as IIssue[])
    : viewId
    ? (viewCalendarIssues as IIssue[])
    : (projectCalendarIssues as IIssue[]);

  return {
    issueView,
    calendarIssues: calendarIssues ?? [],
    calendarDateRange,
    setCalendarDateRange,
    filters,
    setFilters,
    params,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueView,
  } as const;
};

export default useCalendarIssuesView;
