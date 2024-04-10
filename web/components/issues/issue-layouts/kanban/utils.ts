import { IIssueMap, TIssue } from "@plane/types";

export const processPragmaticDropPayload = (
  payload: any
): { source: DropLocation; destination: DropLocation } | undefined => {
  const { location, source: sourceIssue } = payload;

  const sourceIssueData = sourceIssue.data;
  let sourceColumData;

  let destinationIssueData, destinationColumnData;

  const destDropTargets = location?.current?.dropTargets ?? [];

  const sourceDropTargets = location?.initial?.dropTargets ?? [];
  for (const dropTarget of sourceDropTargets) {
    const dropTargetData = dropTarget?.data;

    if (!dropTargetData) continue;

    if (dropTargetData.type === "COLUMN") {
      sourceColumData = dropTargetData;
    }
  }

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

  if (sourceIssueData?.id === undefined || !sourceColumData?.groupId || !destinationColumnData?.groupId) return;

  return {
    source: {
      groupId: sourceColumData.groupId as string,
      subGroupId: sourceColumData.subGroupId as string,
      columnId: sourceColumData.columnId as string,
      id: sourceIssueData.id as string,
    },
    destination: {
      groupId: destinationColumnData.groupId as string,
      subGroupId: destinationColumnData.subGroupId as string,
      columnId: destinationColumnData.columnId as string,
      id: destinationIssueData?.id as string | undefined,
    },
  };
};

const handleSortOrder = (destinationIssues: string[], destinationIssueId: string | undefined, issueMap: IIssueMap) => {
  const sortOrderDefaultValue = 65535;
  let currentIssueState = {};

  const destinationIndex = destinationIssueId
    ? destinationIssues.indexOf(destinationIssueId)
    : destinationIssues.length;

  if (destinationIssues && destinationIssues.length > 0) {
    if (destinationIndex === 0) {
      const destinationIssueId = destinationIssues[0];
      currentIssueState = {
        ...currentIssueState,
        sort_order: issueMap[destinationIssueId].sort_order - sortOrderDefaultValue,
      };
    } else if (destinationIndex === destinationIssues.length) {
      const destinationIssueId = destinationIssues[destinationIssues.length - 1];
      currentIssueState = {
        ...currentIssueState,
        sort_order: issueMap[destinationIssueId].sort_order + sortOrderDefaultValue,
      };
    } else {
      const destinationTopIssueId = destinationIssues[destinationIndex - 1];
      const destinationBottomIssueId = destinationIssues[destinationIndex];
      currentIssueState = {
        ...currentIssueState,
        sort_order: (issueMap[destinationTopIssueId].sort_order + issueMap[destinationBottomIssueId].sort_order) / 2,
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

export type DropLocation = {
  columnId: string;
  groupId: string;
  subGroupId?: string;
  id: string | undefined;
};

export const handleDragDrop = async (
  source: DropLocation | null | undefined,
  destination: DropLocation | null | undefined,
  workspaceSlug: string | undefined,
  projectId: string | undefined, // projectId for all views or user id in profile issues
  subGroupBy: string | null,
  groupBy: string | null,
  issueMap: IIssueMap,
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined,
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined,
  removeIssue: (projectId: string, issueId: string) => Promise<void> | undefined
) => {
  if (!issueMap || !source || !destination || !source.id || !workspaceSlug || !projectId) return;

  let updatedIssue: any = {};

  if (!workspaceSlug || !projectId || !groupBy) return;

  if (subGroupBy && (!source.subGroupId || !destination.subGroupId)) return;

  if (destination.columnId === "issue-trash-box") {
    const sourceIssues = getIssueIds(source.groupId, source.subGroupId);

    if (!sourceIssues) return;

    const sourceIndex = sourceIssues.indexOf(source.id);
    const [removed] = sourceIssues.splice(sourceIndex, 1);

    if (removed) {
      return await removeIssue(projectId, removed);
    }

    return;
  }

  //spreading the array to stop changing the original reference
  //since we are removing an id from array further down
  const sourceIssues = getIssueIds(source.groupId, source.subGroupId);
  const destinationIssues = getIssueIds(destination.groupId, destination.subGroupId);

  if (!sourceIssues || !destinationIssues) return;

  const sourceIssue = issueMap[source.id];

  updatedIssue = {
    id: sourceIssue?.id,
    project_id: sourceIssue?.project_id,
  };

  // for both horizontal and vertical dnd
  updatedIssue = {
    ...updatedIssue,
    ...handleSortOrder(
      source.columnId === destination.columnId ? sourceIssues : destinationIssues,
      destination.id,
      issueMap
    ),
  };

  if (subGroupBy && source.subGroupId && destination.subGroupId) {
    if (source.subGroupId === destination.subGroupId) {
      if (source.groupId != destination.groupId) {
        if (groupBy === "state") updatedIssue = { ...updatedIssue, state_id: destination.groupId };
        if (groupBy === "priority") updatedIssue = { ...updatedIssue, priority: destination.groupId };
      }
    } else {
      if (subGroupBy === "state")
        updatedIssue = {
          ...updatedIssue,
          state_id: destination.subGroupId,
          priority: destination.groupId,
        };
      if (subGroupBy === "priority")
        updatedIssue = {
          ...updatedIssue,
          state_id: destination.groupId,
          priority: destination.subGroupId,
        };
    }
  } else {
    // for horizontal dnd
    if (source.columnId != destination.columnId) {
      if (groupBy === "state") updatedIssue = { ...updatedIssue, state_id: destination.groupId };
      if (groupBy === "priority") updatedIssue = { ...updatedIssue, priority: destination.groupId };
    }
  }

  if (updatedIssue && updatedIssue?.id) {
    return updateIssue && (await updateIssue(updatedIssue.project_id, updatedIssue.id, updatedIssue));
  }
};
