import { ISSUE_PRIORITY_FILTERS, TIssuePriorities, TIssueFilterPriorityObject } from "@plane/constants";

export const getIssuePriorityFilters = (priorityKey: TIssuePriorities): TIssueFilterPriorityObject | undefined => {
  const currentIssuePriority: TIssueFilterPriorityObject | undefined =
    ISSUE_PRIORITY_FILTERS && ISSUE_PRIORITY_FILTERS.length > 0
      ? ISSUE_PRIORITY_FILTERS.find((_priority) => _priority.key === priorityKey)
      : undefined;

  if (currentIssuePriority) return currentIssuePriority;
  return undefined;
};
