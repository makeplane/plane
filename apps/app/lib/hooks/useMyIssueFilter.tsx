import { useEffect, useState } from "react";
// hooks
import useUser from "./useUser";
// types
import { Properties, NestedKeyOf, IIssue } from "types";
// services
import userService from "lib/services/user.service";
// common
import { groupBy } from "constants/common";

import { PRIORITIES } from "constants/";

const initialValues: Properties = {
  key: true,
  state: true,
  assignee: true,
  priority: false,
  start_date: false,
  target_date: false,
  cycle: false,
  children_count: false,
};

const useMyIssuesProperties = (issues?: IIssue[]) => {
  const [properties, setProperties] = useState<Properties>(initialValues);
  const [groupByProperty, setGroupByProperty] = useState<NestedKeyOf<IIssue> | null>(null);

  const { states, user } = useUser();

  useEffect(() => {
    if (!user) return;
    setProperties({ ...initialValues, ...user.my_issues_prop?.properties });
    setGroupByProperty(user.my_issues_prop?.groupBy ?? null);
  }, [user]);

  let groupedByIssues: {
    [key: string]: IIssue[];
  } = {
    ...(groupByProperty === "state_detail.name"
      ? Object.fromEntries(
          states
            ?.sort((a, b) => a.sequence - b.sequence)
            ?.map((state) => [
              state.name,
              issues?.filter((issue) => issue.state === state.name) ?? [],
            ]) ?? []
        )
      : groupByProperty === "priority"
      ? Object.fromEntries(
          PRIORITIES.map((priority) => [
            priority,
            issues?.filter((issue) => issue.priority === priority) ?? [],
          ])
        )
      : {}),
    ...groupBy(issues ?? [], groupByProperty ?? ""),
  };

  const setMyIssueProperty = (key: keyof Properties) => {
    if (!user) return;
    userService.updateUser({ my_issues_prop: { properties, groupBy: groupByProperty } });
    setProperties((prevData) => ({
      ...prevData,
      [key]: !prevData[key],
    }));
    localStorage.setItem(
      "my_issues_prop",
      JSON.stringify({
        properties: {
          ...properties,
          [key]: !properties[key],
        },
        groupBy: groupByProperty,
      })
    );
  };

  const setMyIssueGroupByProperty = (groupByProperty: NestedKeyOf<IIssue> | null) => {
    if (!user) return;
    userService.updateUser({ my_issues_prop: { properties, groupBy: groupByProperty } });
    setGroupByProperty(groupByProperty);
    localStorage.setItem(
      "my_issues_prop",
      JSON.stringify({ properties, groupBy: groupByProperty })
    );
  };

  useEffect(() => {
    const viewProps = localStorage.getItem("my_issues_prop");
    if (viewProps) {
      const { properties, groupBy } = JSON.parse(viewProps);
      setProperties(properties);
      setGroupByProperty(groupBy);
    }
  }, []);

  return {
    filteredIssues: groupedByIssues,
    groupByProperty,
    properties,
    setMyIssueProperty,
    setMyIssueGroupByProperty,
  } as const;
};

export default useMyIssuesProperties;
