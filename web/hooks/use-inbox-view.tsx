import { useContext } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// contexts
import { inboxViewContext } from "contexts/inbox-view-context";
// services
import { InboxService } from "services/inbox.service";
// types
import { IInboxQueryParams } from "types";
// fetch-keys
import { INBOX_ISSUES } from "constants/fetch-keys";

const inboxService = new InboxService();

const useInboxView = () => {
  const { filters, setFilters, clearAllFilters } = useContext(inboxViewContext);

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const params: IInboxQueryParams = {
    priority: filters?.priority ? filters?.priority.join(",") : null,
    inbox_status: filters?.inbox_status ? filters?.inbox_status.join(",") : null,
  };

  const { data: inboxIssues, mutate: mutateInboxIssues } = useSWR(
    workspaceSlug && projectId && inboxId && params ? INBOX_ISSUES(inboxId.toString(), params) : null,
    workspaceSlug && projectId && inboxId && params
      ? () => inboxService.getInboxIssues(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), params)
      : null
  );

  let filtersLength = 0;
  Object.keys(filters ?? {}).forEach((key) => {
    const filterKey = key as keyof typeof filters;

    if (filters[filterKey] && Array.isArray(filters[filterKey])) filtersLength += (filters[filterKey] ?? []).length;
  });

  return {
    filters,
    setFilters,
    clearAllFilters,
    filtersLength,
    params,
    issues: inboxIssues,
    mutate: mutateInboxIssues,
  } as const;
};

export default useInboxView;
