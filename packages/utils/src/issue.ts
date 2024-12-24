import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { ISSUE_PRIORITY_FILTERS, STATE_GROUPS, TIssuePriorities, TIssueFilterPriorityObject } from "@plane/constants";
import { TStateGroups } from "@plane/types";
import { getDate } from "./datetime";

export const getIssuePriorityFilters = (priorityKey: TIssuePriorities): TIssueFilterPriorityObject | undefined => {
  const currentIssuePriority: TIssueFilterPriorityObject | undefined =
    ISSUE_PRIORITY_FILTERS && ISSUE_PRIORITY_FILTERS.length > 0
      ? ISSUE_PRIORITY_FILTERS.find((_priority) => _priority.key === priorityKey)
      : undefined;

  if (currentIssuePriority) return currentIssuePriority;
  return undefined;
};

/**
 * @description check if the issue due date should be highlighted
 * @param date
 * @param stateGroup
 * @returns boolean
 */
export const shouldHighlightIssueDueDate = (
  date: string | Date | null,
  stateGroup: TStateGroups | undefined
): boolean => {
  if (!date || !stateGroup) return false;
  // if the issue is completed or cancelled, don't highlight the due date
  if ([STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key].includes(stateGroup)) return false;

  const parsedDate = getDate(date);
  if (!parsedDate) return false;

  const targetDateDistance = differenceInCalendarDays(parsedDate, new Date());

  // if the issue is overdue, highlight the due date
  return targetDateDistance <= 0;
};
