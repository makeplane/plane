import { useMemo } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import userService from "services/user.service";
// hooks
import useMyIssuesFilters from "hooks/my-issues/use-my-issues-filter";
// types
import { IIssue } from "types";
// fetch-keys
import { USER_ISSUES } from "constants/fetch-keys";

const useMyIssues = (workspaceSlug: string | undefined) => {
  const router = useRouter();

  const { filters, groupBy, orderBy } = useMyIssuesFilters(workspaceSlug);

  const params: any = {
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    group_by: groupBy,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    order_by: orderBy,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    state_group: filters?.state_group ? filters?.state_group.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    type: filters?.type ? filters?.type : undefined,
  };

  const { data: myIssues, mutate: mutateMyIssues } = useSWR(
    workspaceSlug && router.pathname.includes("my-issues")
      ? USER_ISSUES(workspaceSlug.toString(), params)
      : null,
    workspaceSlug && router.pathname.includes("my-issues")
      ? () => userService.userIssues(workspaceSlug.toString(), params)
      : null
  );

  const groupedIssues:
    | {
        [key: string]: IIssue[];
      }
    | undefined = useMemo(() => {
    if (!myIssues) return undefined;

    if (Array.isArray(myIssues))
      return {
        allIssues: myIssues,
      };

    return myIssues;
  }, [myIssues]);

  const isEmpty =
    Object.values(groupedIssues ?? {}).every((group) => group.length === 0) ||
    Object.keys(groupedIssues ?? {}).length === 0;

  return {
    groupedIssues,
    isEmpty,
    mutateMyIssues,
    params,
  };
};

export default useMyIssues;
