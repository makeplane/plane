import { DraggableLocation } from "@hello-pangea/dnd";
import { IProjectIssues } from "store/issue/project";
import { IGroupedIssues, IIssueMap, ISubGroupedIssues, TUnGroupedIssues } from "types";

export const handleDragDrop = async (
  source: DraggableLocation | null,
  destination: DraggableLocation | null,
  workspaceSlug: string,
  projectId: string, // projectId for all views or user id in profile issues
  store: IProjectIssues,
  subGroupBy: string | null,
  groupBy: string | null,
  issueMap: IIssueMap,
  issueWithIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined,
  viewId: string | null = null // it can be moduleId, cycleId
) => {
  if (!issueMap || !issueWithIds || !source || !destination) return;

  let updateIssue: any = {};

  const sourceColumnId = (source?.droppableId && source?.droppableId.split("__")) || null;
  const destinationColumnId = (destination?.droppableId && destination?.droppableId.split("__")) || null;

  if (!sourceColumnId || !destinationColumnId) return;

  const sourceGroupByColumnId = sourceColumnId[0] || null;
  const destinationGroupByColumnId = destinationColumnId[0] || null;

  const sourceSubGroupByColumnId = sourceColumnId[1] || null;
  const destinationSubGroupByColumnId = destinationColumnId[1] || null;

  if (
    !workspaceSlug ||
    !projectId ||
    !groupBy ||
    !sourceGroupByColumnId ||
    !destinationGroupByColumnId ||
    !sourceSubGroupByColumnId ||
    !sourceGroupByColumnId
  )
    return;

  if (destinationGroupByColumnId === "issue-trash-box") {
    const sourceIssues: string[] = subGroupBy
      ? (issueWithIds as ISubGroupedIssues)[sourceSubGroupByColumnId][sourceGroupByColumnId]
      : (issueWithIds as IGroupedIssues)[sourceGroupByColumnId];

    const [removed] = sourceIssues.splice(source.index, 1);

    if (removed) {
      if (viewId) return await store?.removeIssue(workspaceSlug, projectId, removed); //, viewId);
      else return await store?.removeIssue(workspaceSlug, projectId, removed);
    }
  } else {
    const sourceIssues = subGroupBy
      ? (issueWithIds as ISubGroupedIssues)[sourceSubGroupByColumnId][sourceGroupByColumnId]
      : (issueWithIds as IGroupedIssues)[sourceGroupByColumnId];
    const destinationIssues = subGroupBy
      ? (issueWithIds as ISubGroupedIssues)[sourceSubGroupByColumnId][destinationGroupByColumnId]
      : (issueWithIds as IGroupedIssues)[destinationGroupByColumnId];

    const [removed] = sourceIssues.splice(source.index, 1);
    const removedIssueDetail = issueMap.allIssues[removed];

    if (subGroupBy && sourceSubGroupByColumnId && destinationSubGroupByColumnId) {
      updateIssue = {
        id: removedIssueDetail?.id,
      };

      // for both horizontal and vertical dnd
      updateIssue = {
        ...updateIssue,
        ...handleSortOrder(destinationIssues, destination.index, issueMap),
      };

      if (sourceSubGroupByColumnId === destinationSubGroupByColumnId) {
        if (sourceGroupByColumnId != destinationGroupByColumnId) {
          if (groupBy === "state") updateIssue = { ...updateIssue, state: destinationGroupByColumnId };
          if (groupBy === "priority") updateIssue = { ...updateIssue, priority: destinationGroupByColumnId };
        }
      } else {
        if (subGroupBy === "state")
          updateIssue = {
            ...updateIssue,
            state: destinationSubGroupByColumnId,
            priority: destinationGroupByColumnId,
          };
        if (subGroupBy === "priority")
          updateIssue = {
            ...updateIssue,
            state: destinationGroupByColumnId,
            priority: destinationSubGroupByColumnId,
          };
      }
    } else {
      updateIssue = {
        id: removedIssueDetail?.id,
      };

      // for both horizontal and vertical dnd
      updateIssue = {
        ...updateIssue,
        ...handleSortOrder(destinationIssues, destination.index, issueMap),
      };

      // for horizontal dnd
      if (sourceColumnId != destinationColumnId) {
        if (groupBy === "state") updateIssue = { ...updateIssue, state: destinationGroupByColumnId };
        if (groupBy === "priority") updateIssue = { ...updateIssue, priority: destinationGroupByColumnId };
      }
    }

    if (updateIssue && updateIssue?.id) {
      if (viewId) return await store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue); //, viewId);
      else return await store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue);
    }
  }
};

const handleSortOrder = (destinationIssues: string[], destinationIndex: number, issueMap: IIssueMap) => {
  const sortOrderDefaultValue = 65535;
  let currentIssueState = {};

  if (destinationIssues && destinationIssues.length > 0) {
    if (destinationIndex === 0) {
      const destinationIssueId = destinationIssues[destinationIndex];
      currentIssueState = {
        ...currentIssueState,
        sort_order: issueMap.allIssues[destinationIssueId].sort_order - sortOrderDefaultValue,
      };
    } else if (destinationIndex === destinationIssues.length) {
      const destinationIssueId = destinationIssues[destinationIndex - 1];
      currentIssueState = {
        ...currentIssueState,
        sort_order: issueMap.allIssues[destinationIssueId].sort_order + sortOrderDefaultValue,
      };
    } else {
      const destinationTopIssueId = destinationIssues[destinationIndex - 1];
      const destinationBottomIssueId = destinationIssues[destinationIndex];
      currentIssueState = {
        ...currentIssueState,
        sort_order:
          (issueMap.allIssues[destinationTopIssueId].sort_order +
            issueMap.allIssues[destinationBottomIssueId].sort_order) /
          2,
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
