import isEmpty from "lodash/isEmpty";
import uniq from "lodash/uniq";
import { TIssue } from "@plane/types";
import { ALL_ISSUES } from "@/constants/issue";
import { EIssueGroupedAction } from "./base-issues.store";

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
