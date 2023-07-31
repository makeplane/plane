import { useContext, useEffect, useMemo } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import userService from "services/user.service";
// contexts
import { profileIssuesContext } from "contexts/profile-issues-context";
// types
import { IIssue } from "types";
// fetch-keys
import { USER_PROFILE_ISSUES } from "constants/fetch-keys";
import { useWorkspaceMyMembership } from "contexts/workspace-member.context";

const useProfileIssues = (workspaceSlug: string | undefined, userId: string | undefined) => {
  const {
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
    properties,
    setProperties,
  } = useContext(profileIssuesContext);

  const router = useRouter();

  const { memberRole } = useWorkspaceMyMembership();

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
    subscriber: filters?.subscriber ? filters?.subscriber : undefined,
  };

  const { data: userProfileIssues, mutate: mutateProfileIssues } = useSWR(
    workspaceSlug && userId && (memberRole.isOwner || memberRole.isMember || memberRole.isViewer)
      ? USER_PROFILE_ISSUES(workspaceSlug.toString(), userId.toString(), params)
      : null,
    workspaceSlug && userId && (memberRole.isOwner || memberRole.isMember || memberRole.isViewer)
      ? () => userService.getUserProfileIssues(workspaceSlug.toString(), userId.toString(), params)
      : null
  );

  console.log(memberRole);

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

  useEffect(() => {
    if (!userId || !filters) return;

    if (
      router.pathname.includes("assigned") &&
      (!filters.assignees || !filters.assignees.includes(userId))
    ) {
      setFilters({ assignees: [...(filters.assignees ?? []), userId] });
      return;
    }

    if (
      router.pathname.includes("created") &&
      (!filters.created_by || !filters.created_by.includes(userId))
    ) {
      setFilters({ created_by: [...(filters.created_by ?? []), userId] });
      return;
    }

    if (router.pathname.includes("subscribed") && filters.subscriber === null) {
      setFilters({ subscriber: userId });
      return;
    }
  }, [filters, router, setFilters, userId]);

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
    properties,
    setProperties,
    isEmpty,
    mutateProfileIssues,
    params,
  };
};

export default useProfileIssues;
