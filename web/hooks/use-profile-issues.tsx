import { useContext, useEffect, useMemo } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { UserService } from "services/user.service";
// contexts
import { profileIssuesContext } from "contexts/profile-issues-context";
import { useWorkspaceMyMembership } from "contexts/workspace-member.context";
// types
import { IIssue } from "types";
// fetch-keys
import { USER_PROFILE_ISSUES } from "constants/fetch-keys";

const userService = new UserService();

const useProfileIssues = (workspaceSlug: string | undefined, userId: string | undefined) => {
  const {
    display_filters: displayFilters,
    setDisplayFilters,
    filters,
    setFilters,
    display_properties: displayProperties,
    setProperties,
  } = useContext(profileIssuesContext);

  const router = useRouter();

  const { memberRole } = useWorkspaceMyMembership();

  const params: any = {
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    group_by: displayFilters?.group_by,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    order_by: displayFilters?.order_by,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    state_group: filters?.state_group ? filters?.state_group.join(",") : undefined,
    start_date: filters?.start_date ? filters?.start_date.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    type: displayFilters?.type ? displayFilters?.type : undefined,
    subscriber: filters?.subscriber ? filters?.subscriber.join(",") : undefined,
  };

  const { data: userProfileIssues, mutate: mutateProfileIssues } = useSWR(
    workspaceSlug && userId && (memberRole.isOwner || memberRole.isMember || memberRole.isViewer)
      ? USER_PROFILE_ISSUES(workspaceSlug.toString(), userId.toString(), params)
      : null,
    workspaceSlug && userId && (memberRole.isOwner || memberRole.isMember || memberRole.isViewer)
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

    if (displayFilters?.group_by === "state_detail.group") {
      return userProfileIssues
        ? Object.assign(
            {
              backlog: [],
              unstarted: [],
              started: [],
              completed: [],
              cancelled: [],
            },
            userProfileIssues
          )
        : undefined;
    }

    return userProfileIssues;
  }, [displayFilters?.group_by, userProfileIssues]);

  useEffect(() => {
    if (!userId || !filters) return;

    if (router.pathname.includes("assigned") && (!filters.assignees || !filters.assignees.includes(userId))) {
      setFilters({ assignees: [...(filters.assignees ?? []), userId] });
      return;
    }

    if (router.pathname.includes("created") && (!filters.created_by || !filters.created_by.includes(userId))) {
      setFilters({ created_by: [...(filters.created_by ?? []), userId] });
      return;
    }

    if (router.pathname.includes("subscribed") && filters.subscriber === null) {
      setFilters({ subscriber: [userId] });
      return;
    }
  }, [filters, router, setFilters, userId]);

  const isEmpty =
    Object.values(groupedIssues ?? {}).every((group) => group.length === 0) ||
    Object.keys(groupedIssues ?? {}).length === 0;

  return {
    groupedIssues,
    displayFilters,
    setDisplayFilters,
    filters,
    setFilters,
    displayProperties,
    setProperties,
    isEmpty,
    mutateProfileIssues,
    params,
  };
};

export default useProfileIssues;
