import { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";
// constants
import { STATE_LIST } from "constants/fetch-keys";
// services
import stateService from "lib/services/state.service";
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
  due_date: false,
  cycle: false,
  sub_issue_count: false,
};

const useMyIssuesProperties = (issues?: IIssue[]) => {
  const [properties, setProperties] = useState<Properties>(initialValues);
  const [groupByProperty, setGroupByProperty] = useState<NestedKeyOf<IIssue> | null>(null);

  // FIXME: where this hook is used we may not have project id in the url
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

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
