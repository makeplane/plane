import { useContext } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// contexts
import { issueViewContext } from "contexts/issue-view.context";
// helpers
import { groupBy, orderArrayBy } from "helpers/array.helper";
import { getStatesList } from "helpers/state.helper";
// types
import { IIssue, IState } from "types";
// fetch-keys
import { STATE_LIST } from "constants/fetch-keys";
// constants
import { PRIORITIES } from "constants/project";

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

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

  let groupedByIssues: {
    [key: string]: IIssue[];
  } = {};

  const groupIssues = (states: IState[], issues: IIssue[]) => ({
    ...(groupByProperty === "state_detail.name"
      ? Object.fromEntries(
          states
            ?.sort((a, b) => a.sequence - b.sequence)
            ?.map((state) => [
              state.name,
              issues.filter((issue) => issue.state === state.name) ?? [],
            ]) ?? []
        )
      : groupByProperty === "priority"
      ? Object.fromEntries(
          PRIORITIES.map((priority) => [
            priority,
            issues.filter((issue) => issue.priority === priority) ?? [],
          ])
        )
      : {}),
    ...groupBy(issues ?? [], groupByProperty ?? ""),
  });

  groupedByIssues = groupIssues(states ?? [], projectIssues);

  if (filterIssue) {
    if (filterIssue === "activeIssue") {
      const filteredStates = states?.filter(
        (s) => s.group === "started" || s.group === "unstarted"
      );
      const filteredIssues = projectIssues.filter(
        (i) => i.state_detail.group === "started" || i.state_detail.group === "unstarted"
      );

      groupedByIssues = groupIssues(filteredStates ?? [], filteredIssues);
    } else if (filterIssue === "backlogIssue") {
      const filteredStates = states?.filter(
        (s) => s.group === "backlog" || s.group === "cancelled"
      );
      const filteredIssues = projectIssues.filter(
        (i) => i.state_detail.group === "backlog" || i.state_detail.group === "cancelled"
      );

      groupedByIssues = groupIssues(filteredStates ?? [], filteredIssues);
    }
  }

  if (orderBy) {
    groupedByIssues = Object.fromEntries(
      Object.entries(groupedByIssues).map(([key, value]) => [
        key,
        orderArrayBy(value, orderBy, "descending"),
      ])
    );
  }

  if (groupByProperty === "priority") {
    delete groupedByIssues.None;
    if (orderBy === "priority") setOrderBy("created_at");
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

export default useIssueView;
