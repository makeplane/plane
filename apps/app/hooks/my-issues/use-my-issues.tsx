import { useMemo } from "react";

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
  const { filters, groupBy, orderBy } = useMyIssuesFilters(workspaceSlug);

  const params: any = {
    group_by: groupBy,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    order_by: orderBy,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    state: filters?.state ? filters?.state.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    type: filters?.type ? filters?.type : undefined,
  };

  const { data: myIssues, mutate: mutateMyIssues } = useSWR(
    workspaceSlug ? USER_ISSUES(workspaceSlug as string, params) : null,
    workspaceSlug ? () => userService.userIssues(workspaceSlug as string, params) : null
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
