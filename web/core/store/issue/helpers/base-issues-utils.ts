import cloneDeep from "lodash/cloneDeep";
import groupBy from "lodash/groupBy";
import indexOf from "lodash/indexOf";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import uniq from "lodash/uniq";
import { ALL_ISSUES, EIssueFilterType, FILTER_TO_ISSUE_MAP, ISSUE_PRIORITIES } from "@plane/constants";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IIssueFilters,
  TIssue,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "@plane/types";
import { checkDateCriteria, convertToISODateString, parseDateFilter } from "@plane/utils";
import { store } from "@/lib/store-context";
import { EIssueGroupedAction, ISSUE_GROUP_BY_KEY } from "./base-issues.store";

/**
 * returns,
 * A compound key, if both groupId & subGroupId are defined
 * groupId, only if groupId is defined
 * ALL_ISSUES, if both groupId & subGroupId are not defined
 * @param groupId
 * @param subGroupId
 * @returns
 */
export const getGroupKey = (groupId?: string, subGroupId?: string) => {
  if (groupId && subGroupId && subGroupId !== "null") return `${groupId}_${subGroupId}`;

  if (groupId) return groupId;

  return ALL_ISSUES;
};

/**
 * This method returns the issue key actions for based on the difference in issue properties of grouped values
 * @param addArray Array of groupIds at which the issue needs to be added
 * @param deleteArray Array of groupIds at which the issue needs to be deleted
 * @returns an array of objects that contains the issue Path at which it needs to be updated and the action that needs to be performed at the path as well
 */
export const getGroupIssueKeyActions = (
  addArray: string[],
  deleteArray: string[]
): { path: string[]; action: EIssueGroupedAction }[] => {
  const issueKeyActions = [];

  // Add all the groupIds as IssueKey and action as Add
  for (const addKey of addArray) {
    issueKeyActions.push({ path: [addKey], action: EIssueGroupedAction.ADD });
  }

  // Add all the groupIds as IssueKey and action as Delete
  for (const deleteKey of deleteArray) {
    issueKeyActions.push({ path: [deleteKey], action: EIssueGroupedAction.DELETE });
  }

  return issueKeyActions;
};

/**
 * This method returns the issue key actions for based on the difference in issue properties of grouped and subGrouped values
 * @param groupActionsArray Addition and Deletion arrays of groupIds at which the issue needs to be added and deleted
 * @param subGroupActionsArray Addition and Deletion arrays of subGroupIds at which the issue needs to be added and deleted
 * @param previousIssueGroupProperties previous value of the issue property that on which grouping is dependent on
 * @param currentIssueGroupProperties current value of the issue property that on which grouping is dependent on
 * @param previousIssueSubGroupProperties previous value of the issue property that on which subGrouping is dependent on
 * @param currentIssueSubGroupProperties current value of the issue property that on which subGrouping is dependent on
 * @returns an array of objects that contains the issue Path at which it needs to be updated and the action that needs to be performed at the path as well
 */
export const getSubGroupIssueKeyActions = (
  groupActionsArray: {
    [EIssueGroupedAction.ADD]: string[];
    [EIssueGroupedAction.DELETE]: string[];
  },
  subGroupActionsArray: {
    [EIssueGroupedAction.ADD]: string[];
    [EIssueGroupedAction.DELETE]: string[];
  },
  previousIssueGroupProperties: string[],
  currentIssueGroupProperties: string[],
  previousIssueSubGroupProperties: string[],
  currentIssueSubGroupProperties: string[]
): { path: string[]; action: EIssueGroupedAction }[] => {
  const issueKeyActions: { [key: string]: { path: string[]; action: EIssueGroupedAction } } = {};

  // For every groupId path for issue Id List, that needs to be added,
  // It needs to be added at all the current Issue Properties that on which subGrouping depends on
  for (const addKey of groupActionsArray[EIssueGroupedAction.ADD]) {
    for (const subGroupProperty of currentIssueSubGroupProperties) {
      issueKeyActions[getGroupKey(addKey, subGroupProperty)] = {
        path: [addKey, subGroupProperty],
        action: EIssueGroupedAction.ADD,
      };
    }
  }

  // For every groupId path for issue Id List, that needs to be deleted,
  // It needs to be deleted at all the previous Issue Properties that on which subGrouping depends on
  for (const deleteKey of groupActionsArray[EIssueGroupedAction.DELETE]) {
    for (const subGroupProperty of previousIssueSubGroupProperties) {
      issueKeyActions[getGroupKey(deleteKey, subGroupProperty)] = {
        path: [deleteKey, subGroupProperty],
        action: EIssueGroupedAction.DELETE,
      };
    }
  }

  // For every subGroupId path for issue Id List, that needs to be added,
  // It needs to be added at all the current Issue Properties that on which grouping depends on
  for (const addKey of subGroupActionsArray[EIssueGroupedAction.ADD]) {
    for (const groupProperty of currentIssueGroupProperties) {
      issueKeyActions[getGroupKey(groupProperty, addKey)] = {
        path: [groupProperty, addKey],
        action: EIssueGroupedAction.ADD,
      };
    }
  }

  // For every subGroupId path for issue Id List, that needs to be deleted,
  // It needs to be deleted at all the previous Issue Properties that on which grouping depends on
  for (const deleteKey of subGroupActionsArray[EIssueGroupedAction.DELETE]) {
    for (const groupProperty of previousIssueGroupProperties) {
      issueKeyActions[getGroupKey(groupProperty, deleteKey)] = {
        path: [groupProperty, deleteKey],
        action: EIssueGroupedAction.DELETE,
      };
    }
  }

  return Object.values(issueKeyActions);
};

/**
 * This Method is used to get the difference between two arrays
 * @param current
 * @param previous
 * @param action
 * @returns returns two arrays, ADD and DELETE.
 *           Whatever is newly added to current is added to ADD array
 *           Whatever is removed from previous is added to DELETE array
 */
export const getDifference = (
  current: string[],
  previous: string[],
  action?: EIssueGroupedAction.ADD | EIssueGroupedAction.DELETE
): { [EIssueGroupedAction.ADD]: string[]; [EIssueGroupedAction.DELETE]: string[] } => {
  const ADD = [];
  const DELETE = [];

  // For all the current issues values that are not in the previous array, Add them to the ADD array
  for (const currentValue of current) {
    if (previous.includes(currentValue)) continue;
    ADD.push(currentValue);
  }

  // For all the previous issues values that are not in the current array, Add them to the ADD array
  for (const previousValue of previous) {
    if (current.includes(previousValue)) continue;
    DELETE.push(previousValue);
  }

  // if there are no action provided, return the arrays
  if (!action) return { [EIssueGroupedAction.ADD]: ADD, [EIssueGroupedAction.DELETE]: DELETE };

  // If there is an action provided, return the values of both arrays under that array
  if (action === EIssueGroupedAction.ADD)
    return { [EIssueGroupedAction.ADD]: uniq([...ADD]), [EIssueGroupedAction.DELETE]: [] };
  else return { [EIssueGroupedAction.DELETE]: uniq([...DELETE]), [EIssueGroupedAction.ADD]: [] };
};

/**
 * This Method is mainly used to filter out empty values in the beginning
 * @param key key of the value that is to be checked if empty
 * @param object any object in which the key's value is to be checked
 * @returns 1 if empty, 0 if not empty
 */
export const getSortOrderToFilterEmptyValues = (key: string, object: any) => {
  const value = object?.[key];

  if (typeof value !== "number" && isEmpty(value)) return 1;

  return 0;
};

// get IssueIds from Issue data List
export const getIssueIds = (issues: TIssue[]) => issues.map((issue) => issue?.id);

/**
 * Checks if an issue meets the date filter criteria
 * @param issue The issue to check
 * @param filterKey The date field to check ('start_date' or 'target_date')
 * @param dateFilters Array of date filter strings
 * @returns boolean indicating if the issue meets the date criteria
 */
export const checkIssueDateFilter = (
  issue: TIssue,
  filterKey: "start_date" | "target_date",
  dateFilters: string[]
): boolean => {
  if (!dateFilters || dateFilters.length === 0) return true;

  const issueDate = issue[filterKey];
  if (!issueDate) return false;

  // Issue should match all the date filters (AND operation)
  return dateFilters.every((filterValue) => {
    const parsed = parseDateFilter(filterValue);
    if (!parsed?.date || !parsed?.type) {
      // ignore invalid filter instead of failing the whole evaluation
      console.warn(`[filters] Ignoring unparsable date filter "${filterValue}"`);
      return true;
    }
    return checkDateCriteria(new Date(issueDate), parsed.date, parsed.type);
  });
};

/**
 * Helper method to get previous issues state
 * @param issues - The array of issues to get the previous state for.
 * @returns The previous state of the issues.
 */
export const getPreviousIssuesState = (issues: TIssue[]) => {
  const issueIds = issues.map((issue) => issue.id);
  const issuesPreviousState: Record<string, TIssue> = {};
  issueIds.forEach((issueId) => {
    if (store.issue.issues.issuesMap[issueId]) {
      issuesPreviousState[issueId] = cloneDeep(store.issue.issues.issuesMap[issueId]);
    }
  });
  return issuesPreviousState;
};

/**
 * Filters the given work items based on the provided filters and display filters.
 * @param work items - The array of work items to be filtered.
 * @param filters - The filters to be applied to the issues.
 * @param displayFilters - The display filters to be applied to the issues.
 * @returns The filtered array of issues.
 */
export const getFilteredWorkItems = (workItems: TIssue[], filters: IIssueFilterOptions | undefined): TIssue[] => {
  if (!filters) return workItems;
  // Get all active filters
  const activeFilters = Object.entries(filters).filter(([, value]) => value && value.length > 0);
  // If no active filters, return all issues
  if (activeFilters.length === 0) {
    return workItems;
  }

  return workItems.filter((workItem) =>
    // Check all filter conditions (AND operation between different filters)
    activeFilters.every(([filterKey, filterValues]) => {
      // Handle date filters separately
      if (filterKey === "start_date" || filterKey === "target_date") {
        return checkIssueDateFilter(workItem, filterKey as "start_date" | "target_date", filterValues as string[]);
      }
      // Handle regular filters
      const issueKey = FILTER_TO_ISSUE_MAP[filterKey as keyof IIssueFilterOptions];
      if (!issueKey) return true; // Skip if no mapping exists
      const issueValue = workItem[issueKey as keyof TIssue];
      // Handle array-based properties vs single value properties
      if (Array.isArray(issueValue)) {
        return filterValues!.some((filterValue: any) => issueValue.includes(filterValue));
      } else {
        return filterValues!.includes(issueValue as string);
      }
    })
  );
};

/**
 * Orders the given work items based on the provided order by key.
 * @param workItems - The array of work items to be ordered.
 * @param orderByKey - The key to order the issues by.
 * @returns The ordered array of work items.
 */
export const getOrderedWorkItems = (workItems: TIssue[], orderByKey: TIssueOrderByOptions): string[] => {
  switch (orderByKey) {
    case "-updated_at":
      return getIssueIds(orderBy(workItems, (item) => convertToISODateString(item["updated_at"]), ["desc"]));

    case "-created_at":
      return getIssueIds(orderBy(workItems, (item) => convertToISODateString(item["created_at"]), ["desc"]));

    case "-start_date":
      return getIssueIds(
        orderBy(
          workItems,
          [getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        )
      );

    case "-priority": {
      const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
      return getIssueIds(
        orderBy(workItems, (currentIssue: TIssue) => indexOf(sortArray, currentIssue?.priority), ["asc"])
      );
    }
    default:
      return getIssueIds(workItems);
  }
};

export const getGroupedWorkItemIds = (
  workItems: TIssue[],
  groupByKey?: TIssueGroupByOptions,
  orderByKey: TIssueOrderByOptions = "-created_at"
): Record<string, string[]> => {
  // If group by is not set set default as ALL ISSUES
  if (!groupByKey) {
    return {
      [ALL_ISSUES]: getOrderedWorkItems(workItems, orderByKey),
    };
  }

  // Get the default key for the group by key
  const getDefaultGroupKey = (groupByKey: TIssueGroupByOptions) => {
    switch (groupByKey) {
      case "state_detail.group":
        return "state__group";
      case null:
        return null;
      default:
        return ISSUE_GROUP_BY_KEY[groupByKey];
    }
  };

  // Group work items
  const groupKey = getDefaultGroupKey(groupByKey);
  const groupedWorkItems = groupBy(workItems, (item) => {
    const value = groupKey ? item[groupKey] : null;
    if (Array.isArray(value)) {
      if (value.length === 0) return "None";
      // Sort & join to build deterministic set-like key
      return value.slice().sort().join(",");
    }
    return value ?? "None";
  });

  // Convert to Record type
  const groupedWorkItemsRecord: Record<string, string[]> = {};
  Object.entries(groupedWorkItems).forEach(([key, items]) => {
    groupedWorkItemsRecord[key] = getOrderedWorkItems(items as TIssue[], orderByKey);
  });

  return groupedWorkItemsRecord;
};

/**
 * Updates the filters for a given work item.
 * @param filtersMap - The map of filters for the work item.
 * @param filterType - The type of filter to update.
 * @param filters - The filters to update.
 * @param workItemId - The ID of the work item to update.
 */
export const updateFilters = (
  filtersMap: Record<string, Partial<IIssueFilters>>,
  filterType: EIssueFilterType,
  filters: IIssueDisplayFilterOptions | IIssueDisplayProperties | IIssueFilterOptions,
  workItemId: string
) => {
  const existingFilters = filtersMap[workItemId] ?? {};
  const _filters = {
    filters: existingFilters.filters,
    displayFilters: existingFilters.displayFilters,
    displayProperties: existingFilters.displayProperties,
  };

  switch (filterType) {
    case EIssueFilterType.FILTERS: {
      const updatedFilters = filters as IIssueFilterOptions;
      _filters.filters = { ..._filters.filters, ...updatedFilters };
      set(filtersMap, [workItemId, "filters"], { ..._filters.filters, ...updatedFilters });
      break;
    }
    case EIssueFilterType.DISPLAY_FILTERS: {
      set(filtersMap, [workItemId, "displayFilters"], { ..._filters.displayFilters, ...filters });
      break;
    }
    case EIssueFilterType.DISPLAY_PROPERTIES:
      set(filtersMap, [workItemId, "displayProperties"], {
        ..._filters.displayProperties,
        ...filters,
      });
      break;
  }
};
