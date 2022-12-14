// swr
import useSWR from "swr";
// services
import stateService from "lib/services/state.service";
// constants
import { STATE_LIST } from "constants/fetch-keys";
// hooks
import useTheme from "./useTheme";
// commons
import { groupBy, orderArrayBy } from "constants/common";
// constants
import { PRIORITIES } from "constants/";
// types
import type { IIssue } from "types";
import { useRouter } from "next/router";

const useIssuesFilter = (projectIssues: IIssue[]) => {
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
  } = useTheme();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  let groupedByIssues: {
    [key: string]: IIssue[];
  } = {
    ...(groupByProperty === "state_detail.name"
      ? Object.fromEntries(
          states
            ?.sort((a, b) => a.sequence - b.sequence)
            ?.map((state) => [
              state.name,
              projectIssues.filter((issue) => issue.state === state.name) ?? [],
            ]) ?? []
        )
      : groupByProperty === "priority"
      ? Object.fromEntries(
          PRIORITIES.map((priority) => [
            priority,
            projectIssues.filter((issue) => issue.priority === priority) ?? [],
          ])
        )
      : {}),
    ...groupBy(projectIssues ?? [], groupByProperty ?? ""),
  };

  if (orderBy !== null) {
    groupedByIssues = Object.fromEntries(
      Object.entries(groupedByIssues).map(([key, value]) => [
        key,
        orderArrayBy(value, orderBy, "descending"),
      ])
    );
  }

  if (filterIssue !== null) {
    if (filterIssue === "activeIssue") {
      const filteredStates = states?.filter(
        (state) => state.group === "started" || state.group === "unstarted"
      );
      groupedByIssues = Object.fromEntries(
        filteredStates
          ?.sort((a, b) => a.sequence - b.sequence)
          ?.map((state) => [
            state.name,
            projectIssues.filter((issue) => issue.state === state.id) ?? [],
          ]) ?? []
      );
    } else if (filterIssue === "backlogIssue") {
      const filteredStates = states?.filter(
        (state) => state.group === "backlog" || state.group === "cancelled"
      );
      groupedByIssues = Object.fromEntries(
        filteredStates
          ?.sort((a, b) => a.sequence - b.sequence)
          ?.map((state) => [
            state.name,
            projectIssues.filter((issue) => issue.state === state.id) ?? [],
          ]) ?? []
      );
    }
  }

  if (groupByProperty === "priority" && orderBy === "priority") {
    setOrderBy(null);
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

export default useIssuesFilter;
