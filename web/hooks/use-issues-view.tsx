import { useContext, useMemo } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// contexts
import { issueViewContext } from "contexts/issue-view.context";
// services
import { IssueService, IssueArchiveService, IssueDraftService } from "services/issue";
import { CycleService } from "services/cycle.service";
import { ModuleService } from "services/module.service";
import { ProjectStateService } from "services/project";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import type { IIssue } from "types";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ARCHIVED_ISSUES_LIST_WITH_PARAMS,
  PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  STATES_LIST,
  VIEW_ISSUES,
} from "constants/fetch-keys";

// services
const issueService = new IssueService();
const issueArchiveService = new IssueArchiveService();
const issueDraftService = new IssueDraftService();
const cycleService = new CycleService();
const moduleService = new ModuleService();
const projectStateService = new ProjectStateService();

const useIssuesView = () => {
  const {
    display_filters: displayFilters,
    setDisplayFilters,
    filters,
    setFilters,
    resetFilterToDefault,
    setNewFilterDefaultView,
  } = useContext(issueViewContext);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId, archivedIssueId } = router.query;
  const isArchivedIssues = router.pathname.includes("archived-issues");
  const isDraftIssues = router.pathname.includes("draft-issues");

  const params: any = {
    order_by: displayFilters?.order_by,
    group_by: displayFilters?.group_by,
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    state: filters?.state ? filters?.state.join(",") : undefined,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    type: !isArchivedIssues ? (displayFilters?.type ? displayFilters?.type : undefined) : undefined,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    start_date: filters?.start_date ? filters?.start_date.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    sub_issue: displayFilters?.sub_issue,
  };

  const { data: projectIssues, mutate: mutateProjectIssues } = useSWR(
    workspaceSlug && projectId && params ? PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params) : null,
    workspaceSlug && projectId && params
      ? () => issueService.getIssuesWithParams(workspaceSlug as string, projectId as string, params)
      : null
  );

  const { data: projectArchivedIssues, mutate: mutateProjectArchivedIssues } = useSWR(
    workspaceSlug && projectId && params && isArchivedIssues && !archivedIssueId
      ? PROJECT_ARCHIVED_ISSUES_LIST_WITH_PARAMS(projectId as string, params)
      : null,
    workspaceSlug && projectId && params && isArchivedIssues && !archivedIssueId
      ? () => issueArchiveService.getArchivedIssues(workspaceSlug as string, projectId as string, params)
      : null
  );

  const { data: draftIssues, mutate: mutateDraftIssues } = useSWR(
    workspaceSlug && projectId && params && isDraftIssues && !archivedIssueId
      ? PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS(projectId as string, params)
      : null,
    workspaceSlug && projectId && params && isDraftIssues && !archivedIssueId
      ? () => issueDraftService.getDraftIssues(workspaceSlug as string, projectId as string, params)
      : null
  );

  const { data: cycleIssues, mutate: mutateCycleIssues } = useSWR(
    workspaceSlug && projectId && cycleId && params ? CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params) : null,
    workspaceSlug && projectId && cycleId && params
      ? () =>
          cycleService.getCycleIssuesWithParams(workspaceSlug as string, projectId as string, cycleId as string, params)
      : null
  );

  const { data: moduleIssues, mutate: mutateModuleIssues } = useSWR(
    workspaceSlug && projectId && moduleId && params ? MODULE_ISSUES_WITH_PARAMS(moduleId as string, params) : null,
    workspaceSlug && projectId && moduleId && params
      ? () =>
          moduleService.getModuleIssuesWithParams(
            workspaceSlug as string,
            projectId as string,
            moduleId as string,
            params
          )
      : null
  );

  const { data: viewIssues, mutate: mutateViewIssues } = useSWR(
    workspaceSlug && projectId && viewId && params ? VIEW_ISSUES(viewId.toString(), params) : null,
    workspaceSlug && projectId && viewId && params
      ? () => issueService.getIssuesWithParams(workspaceSlug.toString(), projectId.toString(), params)
      : null
  );

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectStateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const statesList = getStatesList(states);
  const activeStatesList = statesList?.filter((state) => state.group === "started" || state.group === "unstarted");
  const backlogStatesList = statesList?.filter((state) => state.group === "backlog");

  const stateIds =
    displayFilters && displayFilters?.type === "active"
      ? activeStatesList?.map((state) => state.id)
      : displayFilters?.type === "backlog"
      ? backlogStatesList?.map((state) => state.id)
      : statesList?.map((state) => state.id);

  const filteredStateIds =
    (filters && filters?.state ? stateIds?.filter((s) => filters.state?.includes(s)) : stateIds) ?? [];

  const emptyStatesObject: { [key: string]: [] } = {};
  for (let i = 0; i < filteredStateIds.length; i++) {
    emptyStatesObject[filteredStateIds[i]] = [];
  }

  const groupedByIssues:
    | {
        [key: string]: IIssue[];
      }
    | undefined = useMemo(() => {
    const issuesToGroup = cycleId
      ? cycleIssues
      : moduleId
      ? moduleIssues
      : viewId
      ? viewIssues
      : isArchivedIssues
      ? projectArchivedIssues
      : isDraftIssues
      ? draftIssues
      : projectIssues;

    if (Array.isArray(issuesToGroup)) return { allIssues: issuesToGroup };
    if (displayFilters?.group_by === "state")
      return issuesToGroup ? Object.assign(emptyStatesObject, issuesToGroup) : undefined;

    return issuesToGroup;
  }, [
    displayFilters?.group_by,
    projectIssues,
    cycleIssues,
    moduleIssues,
    viewIssues,
    projectArchivedIssues,
    cycleId,
    moduleId,
    viewId,
    isArchivedIssues,
    isDraftIssues,
    draftIssues,
    emptyStatesObject,
  ]);

  const isEmpty =
    Object.values(groupedByIssues ?? {}).every((group) => group.length === 0) ||
    Object.keys(groupedByIssues ?? {}).length === 0;

  return {
    displayFilters: {
      ...displayFilters,
      layout: isArchivedIssues ? "list" : displayFilters?.layout,
    },
    setDisplayFilters,
    groupedByIssues,
    mutateIssues: cycleId
      ? mutateCycleIssues
      : moduleId
      ? mutateModuleIssues
      : viewId
      ? mutateViewIssues
      : isArchivedIssues
      ? mutateProjectArchivedIssues
      : isDraftIssues
      ? mutateDraftIssues
      : mutateProjectIssues,
    filters,
    setFilters,
    params,
    isEmpty,
    resetFilterToDefault,
    setNewFilterDefaultView,
  } as const;
};

export default useIssuesView;
