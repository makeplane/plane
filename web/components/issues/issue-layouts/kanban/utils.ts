import clone from "lodash/clone";
import concat from "lodash/concat";
import pull from "lodash/pull";
import uniq from "lodash/uniq";
import { IPragmaticDropPayload, TIssue, TIssueGroupByOptions } from "@plane/types";
import { ISSUE_FILTER_DEFAULT_DATA } from "@/store/issue/helpers/issue-helper.store";

export type KanbanDropLocation = {
  columnId: string;
  groupId: string;
  subGroupId?: string;
  id: string | undefined;
};

export type IssueUpdates = {
  [groupKey: string]: {
    ADD: string[];
    REMOVE: string[];
  };
}

/**
 * get Kanban Source data from Pragmatic Payload
 * @param payload
 * @returns
 */
export const getSourceFromDropPayload = (payload: IPragmaticDropPayload): KanbanDropLocation | undefined => {
  const { location, source: sourceIssue } = payload;

  const sourceIssueData = sourceIssue.data;
  let sourceColumData;

  const sourceDropTargets = location?.initial?.dropTargets ?? [];
  for (const dropTarget of sourceDropTargets) {
    const dropTargetData = dropTarget?.data;

    if (!dropTargetData) continue;

    if (dropTargetData.type === "COLUMN") {
      sourceColumData = dropTargetData;
    }
  }

  if (sourceIssueData?.id === undefined || !sourceColumData?.groupId) return;

  return {
    groupId: sourceColumData.groupId as string,
    subGroupId: sourceColumData.subGroupId as string,
    columnId: sourceColumData.columnId as string,
    id: sourceIssueData.id as string,
  };
};

/**
 * get Destination Source data from Pragmatic Payload
 * @param payload
 * @returns
 */
export const getDestinationFromDropPayload = (payload: IPragmaticDropPayload): KanbanDropLocation | undefined => {
  const { location } = payload;

  let destinationIssueData, destinationColumnData;

  const destDropTargets = location?.current?.dropTargets ?? [];

  for (const dropTarget of destDropTargets) {
    const dropTargetData = dropTarget?.data;

    if (!dropTargetData) continue;

    if (dropTargetData.type === "COLUMN" || dropTargetData.type === "DELETE") {
      destinationColumnData = dropTargetData;
    }

    if (dropTargetData.type === "ISSUE") {
      destinationIssueData = dropTargetData;
    }
  }

  if (!destinationColumnData?.groupId) return;

  return {
    groupId: destinationColumnData.groupId as string,
    subGroupId: destinationColumnData.subGroupId as string,
    columnId: destinationColumnData.columnId as string,
    id: destinationIssueData?.id as string | undefined,
  };
};

/**
 * Returns Sort order of the issue block at the position of drop
 * @param destinationIssues
 * @param destinationIssueId
 * @param getIssueById
 * @returns
 */
const handleSortOrder = (
  destinationIssues: string[],
  destinationIssueId: string | undefined,
  getIssueById: (issueId: string) => TIssue | undefined,
  shouldAddIssueAtTop = false
) => {
  const sortOrderDefaultValue = 65535;
  let currentIssueState = {};

  const destinationIndex = destinationIssueId
    ? destinationIssues.indexOf(destinationIssueId)
    : shouldAddIssueAtTop
      ? 0
      : destinationIssues.length;

  if (destinationIssues && destinationIssues.length > 0) {
    if (destinationIndex === 0) {
      const destinationIssueId = destinationIssues[0];
      const destinationIssue = getIssueById(destinationIssueId);
      if (!destinationIssue) return currentIssueState;

      currentIssueState = {
        ...currentIssueState,
        sort_order: destinationIssue.sort_order - sortOrderDefaultValue,
      };
    } else if (destinationIndex === destinationIssues.length) {
      const destinationIssueId = destinationIssues[destinationIssues.length - 1];
      const destinationIssue = getIssueById(destinationIssueId);
      if (!destinationIssue) return currentIssueState;

      currentIssueState = {
        ...currentIssueState,
        sort_order: destinationIssue.sort_order + sortOrderDefaultValue,
      };
    } else {
      const destinationTopIssueId = destinationIssues[destinationIndex - 1];
      const destinationBottomIssueId = destinationIssues[destinationIndex];

      const destinationTopIssue = getIssueById(destinationTopIssueId);
      const destinationBottomIssue = getIssueById(destinationBottomIssueId);
      if (!destinationTopIssue || !destinationBottomIssue) return currentIssueState;

      currentIssueState = {
        ...currentIssueState,
        sort_order: (destinationTopIssue.sort_order + destinationBottomIssue.sort_order) / 2,
      };
    }
  } else {
    currentIssueState = {
      ...currentIssueState,
      sort_order: sortOrderDefaultValue,
    };
  }

  return currentIssueState;
};

export const getIssueBlockId = (issueId: string | undefined, groupId: string | undefined, subGroupId: string | undefined) => `issue_${issueId}_${groupId}_${subGroupId}`;

/**
 * returns empty Array if groupId is None
 * @param groupId
 * @returns
 */
const getGroupId = (groupId: string) => {
  if(groupId === "None") return [];
  return [groupId];
}

export const handleDragDrop = async (
  source: KanbanDropLocation,
  destination: KanbanDropLocation,
  getIssueById: (issueId: string) => TIssue | undefined,
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined,
  updateIssueOnDrop: (
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    issueUpdates: IssueUpdates
  ) => void,
  groupBy: TIssueGroupByOptions | undefined,
  subGroupBy: TIssueGroupByOptions | undefined,
  shouldAddIssueAtTop = false
) => {
  if (!source.id || !groupBy || (subGroupBy && (!source.subGroupId || !destination.subGroupId))) return;

  let updatedIssue: Partial<TIssue> = {};
  const issueUpdates: IssueUpdates = {};
  const destinationIssues = getIssueIds(destination.groupId, destination.subGroupId) ?? [];

  const sourceIssue = getIssueById(source.id);

  if (!sourceIssue) return;

  updatedIssue = {
    id: sourceIssue.id,
    project_id: sourceIssue.project_id,
  };

  // for both horizontal and vertical dnd
  updatedIssue = {
    ...updatedIssue,
    ...handleSortOrder(destinationIssues, destination.id, getIssueById, shouldAddIssueAtTop),
  };

  // update updatedIssue values based on the source and destination groupIds
  if (source.groupId && destination.groupId && source.groupId !== destination.groupId) {
    const groupKey = ISSUE_FILTER_DEFAULT_DATA[groupBy];
    let groupValue = clone(sourceIssue[groupKey]);

    // If groupValues is an array, remove source groupId and add destination groupId
    if (Array.isArray(groupValue)) {
      pull(groupValue, source.groupId);
      if(destination.groupId !== "None") groupValue = uniq(concat(groupValue, [destination.groupId]));
    } // else just update the groupValue based on destination groupId
    else {
      groupValue = destination.groupId === "None" ? null: destination.groupId;
    }

    // keep track of updates on what was added and what was removed
    issueUpdates[groupKey] = { ADD: getGroupId(destination.groupId), REMOVE: getGroupId(source.groupId) };
    updatedIssue = { ...updatedIssue, [groupKey]: groupValue };
  }

  // do the same for subgroup
  // update updatedIssue values based on the source and destination subGroupIds
  if (subGroupBy && source.subGroupId && destination.subGroupId && source.subGroupId !== destination.subGroupId) {
    const subGroupKey = ISSUE_FILTER_DEFAULT_DATA[subGroupBy];
    let subGroupValue = clone(sourceIssue[subGroupKey]);

    // If subGroupValue is an array, remove source subGroupId and add destination subGroupId
    if (Array.isArray(subGroupValue)) {
      pull(subGroupValue, source.subGroupId);
      if(destination.subGroupId !== "None") subGroupValue = uniq(concat(subGroupValue, [destination.subGroupId]));
    } // else just update the subGroupValue based on destination subGroupId
    else {
      subGroupValue = destination.subGroupId === "None" ? null: destination.subGroupId;
    }

    // keep track of updates on what was added and what was removed
    issueUpdates[subGroupKey] = { ADD: getGroupId(destination.subGroupId), REMOVE: getGroupId(source.subGroupId) };
    updatedIssue = { ...updatedIssue, [subGroupKey]: subGroupValue };
  }

  if (updatedIssue) {
    return await updateIssueOnDrop(
      sourceIssue.project_id,
      sourceIssue.id,
      updatedIssue,
      issueUpdates
    );
  }
};
