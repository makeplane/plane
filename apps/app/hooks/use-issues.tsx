import useSWR from "swr";
// services
import userService from "services/user.service";
// types
import type { IIssue } from "types";
// fetch-keys
import { USER_ISSUE } from "constants/fetch-keys";

const useIssues = (workspaceSlug: string | undefined) => {
  // API Fetching
  const { data: myIssues, mutate: mutateMyIssues } = useSWR<IIssue[]>(
    workspaceSlug ? USER_ISSUE(workspaceSlug as string) : null,
    workspaceSlug ? () => userService.userIssues(workspaceSlug as string) : null
  );

  return {
    myIssues: myIssues || [],
    mutateMyIssues,
  };
};

export default useIssues;
