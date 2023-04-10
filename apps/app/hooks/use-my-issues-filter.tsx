import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import stateService from "services/state.service";
import userService from "services/user.service";
// hooks
import useUser from "hooks/use-user";
// helpers
import { groupBy } from "helpers/array.helper";
import { getStatesList } from "helpers/state.helper";
// types
import { Properties, NestedKeyOf, IIssue } from "types";
// fetch-keys
import { STATE_LIST } from "constants/fetch-keys";
// constants
import { PRIORITIES } from "constants/project";

const initialValues: Properties = {
  assignee: true,
  due_date: false,
  key: true,
  labels: true,
  priority: false,
  state: true,
  sub_issue_count: false,
  estimate: false,
};

// TODO: Refactor this logic
const useMyIssuesProperties = (issues?: IIssue[]) => {
  const [properties, setProperties] = useState<Properties>(initialValues);
  const [groupByProperty, setGroupByProperty] = useState<NestedKeyOf<IIssue> | null>(null);

  // FIXME: where this hook is used we may not have project id in the url
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

  useEffect(() => {
    if (!user) return;
    setProperties({ ...initialValues, ...user.my_issues_prop?.properties });
    setGroupByProperty(user.my_issues_prop?.groupBy ?? null);
  }, [user]);

  const groupedByIssues: {
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
