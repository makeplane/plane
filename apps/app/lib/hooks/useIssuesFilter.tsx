import { useState } from "react";
// hooks
import useTheme from "./useTheme";
import useUser from "./useUser";
// commons
import { groupBy, orderArrayBy } from "constants/common";
// constants
import { PRIORITIES } from "constants/";
// types
import type { IssueResponse, IIssue, NestedKeyOf } from "types";

const useIssuesFilter = (projectIssues?: IssueResponse) => {
  const { issueView, setIssueView, groupByProperty, setGroupByProperty } = useTheme();

  const [orderBy, setOrderBy] = useState<NestedKeyOf<IIssue> | null>(null);

  const [filterIssue, setFilterIssue] = useState<"activeIssue" | "backlogIssue" | null>(null);

  const { states } = useUser();

  let groupedByIssues: {
    [key: string]: IIssue[];
  } = {
    ...(groupByProperty === "state_detail.name"
      ? Object.fromEntries(
          states
            ?.sort((a, b) => a.sequence - b.sequence)
            ?.map((state) => [
              state.name,
              projectIssues?.results.filter((issue) => issue.state === state.name) ?? [],
            ]) ?? []
        )
      : groupByProperty === "priority"
      ? Object.fromEntries(
          PRIORITIES.map((priority) => [
            priority,
            projectIssues?.results.filter((issue) => issue.priority === priority) ?? [],
          ])
        )
      : {}),
    ...groupBy(projectIssues?.results ?? [], groupByProperty ?? ""),
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
      groupedByIssues = Object.keys(groupedByIssues).reduce((acc, key) => {
        const value = groupedByIssues[key];
        const filteredValue = value.filter(
          (issue) =>
            issue.state_detail.group === "started" || issue.state_detail.group === "unstarted"
        );
        if (filteredValue.length > 0) {
          acc[key] = filteredValue;
        }
        return acc;
      }, {} as typeof groupedByIssues);
    } else if (filterIssue === "backlogIssue") {
      groupedByIssues = Object.keys(groupedByIssues).reduce((acc, key) => {
        const value = groupedByIssues[key];
        const filteredValue = value.filter(
          (issue) =>
            issue.state_detail.group === "backlog" || issue.state_detail.group === "cancelled"
        );
        if (filteredValue.length > 0) {
          acc[key] = filteredValue;
        }
        return acc;
      }, {} as typeof groupedByIssues);
    }
  }

  if (groupByProperty === "priority" && orderBy === "priority") {
    setOrderBy(null);
  }

  return {
    groupedByIssues,
    issueView,
    setIssueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    filterIssue,
    setFilterIssue,
  } as const;
};

export default useIssuesFilter;
