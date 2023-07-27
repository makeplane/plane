import { useContext, useMemo } from "react";

import useSWR from "swr";

// services
import userService from "services/user.service";
// contexts
import { profileIssuesContext } from "contexts/profile-issues-context";
// types
import { IIssue } from "types";
// fetch-keys
import { USER_PROFILE_ISSUES } from "constants/fetch-keys";

const useProfileIssues = (workspaceSlug: string | undefined, userId: string | undefined) => {
  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    showEmptyGroups,
    showSubIssues,
    setShowEmptyGroups,
    setShowSubIssues,
    filters,
    setFilters,
    setIssueView,
  } = useContext(profileIssuesContext);

  const params: any = {
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    group_by: groupByProperty,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    order_by: orderBy,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    state_group: filters?.state_group ? filters?.state_group.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    type: filters?.type ? filters?.type : undefined,
  };

  const { data: userProfileIssues, mutate: mutateProfileIssues } = useSWR(
    workspaceSlug && userId
      ? USER_PROFILE_ISSUES(workspaceSlug.toString(), userId.toString(), params)
      : null,
    workspaceSlug && userId
      ? () => userService.getUserProfileIssues(workspaceSlug.toString(), userId.toString(), params)
      : null
  );

  const groupedIssues:
    | {
        [key: string]: IIssue[];
      }
    | undefined = useMemo(() => {
    if (!userProfileIssues) return undefined;

    if (Array.isArray(userProfileIssues))
      return {
        allIssues: userProfileIssues,
      };

    return userProfileIssues;
  }, [userProfileIssues]);

  const isEmpty =
    Object.values(groupedIssues ?? {}).every((group) => group.length === 0) ||
    Object.keys(groupedIssues ?? {}).length === 0;

  return {
    groupedIssues,
    issueView,
    setIssueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    showEmptyGroups,
    setShowEmptyGroups,
    showSubIssues,
    setShowSubIssues,
    filters,
    setFilters,
    isEmpty,
    mutateProfileIssues,
    params,
  };
};

export default useProfileIssues;
