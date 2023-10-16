import { useMemo } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { UserService } from "services/user.service";
// hooks
import useMyIssuesFilters from "hooks/my-issues/use-my-issues-filter";
// types
import { IIssue } from "types";
// fetch-keys
import { USER_ISSUES } from "constants/fetch-keys";

// services
const userService = new UserService();

const useMyIssues = (workspaceSlug: string | undefined) => {
  const router = useRouter();

  const { filters, displayFilters } = useMyIssuesFilters(workspaceSlug);

  const params: any = {
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    group_by: displayFilters?.group_by,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    order_by: displayFilters?.order_by,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    state_group: filters?.state_group ? filters?.state_group.join(",") : undefined,
    subscriber: filters?.subscriber ? filters?.subscriber.join(",") : undefined,
    start_date: filters?.start_date ? filters?.start_date.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    type: displayFilters?.type,
  };

  const { data: myIssues, mutate: mutateMyIssues } = useSWR(
    workspaceSlug && router.pathname.includes("my-issues") ? USER_ISSUES(workspaceSlug.toString(), params) : null,
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

    if (displayFilters?.group_by === "state_detail.group") {
      return myIssues
        ? Object.assign(
            {
              backlog: [],
              unstarted: [],
              started: [],
              completed: [],
              cancelled: [],
            },
            myIssues
          )
        : undefined;
    }

    return myIssues;
  }, [displayFilters, myIssues]);

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
