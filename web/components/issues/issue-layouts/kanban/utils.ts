import { DraggableLocation } from "@hello-pangea/dnd";
import { ICycleIssues } from "store/issue/cycle";
import { IDraftIssues } from "store/issue/draft";
import { IModuleIssues } from "store/issue/module";
import { IProfileIssues } from "store/issue/profile";
import { IProjectIssues } from "store/issue/project";
import { IProjectViewIssues } from "store/issue/project-views";
import { IWorkspaceIssues } from "store/issue/workspace";
import { TGroupedIssues, IIssueMap, TSubGroupedIssues, TUnGroupedIssues } from "@plane/types";

const handleSortOrder = (destinationIssues: string[], destinationIndex: number, issueMap: IIssueMap) => {
  const sortOrderDefaultValue = 65535;
  let currentIssueState = {};

  if (destinationIssues && destinationIssues.length > 0) {
    if (destinationIndex === 0) {
      const destinationIssueId = destinationIssues[destinationIndex];
      currentIssueState = {
        ...currentIssueState,
        sort_order: issueMap[destinationIssueId].sort_order - sortOrderDefaultValue,
      };
    } else if (destinationIndex === destinationIssues.length) {
      const destinationIssueId = destinationIssues[destinationIndex - 1];
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

export const handleDragDrop = async (
  source: DraggableLocation | null | undefined,
  destination: DraggableLocation | null | undefined,
  workspaceSlug: string | undefined,
  projectId: string | undefined, // projectId for all views or user id in profile issues
  store:
    | IProjectIssues
    | ICycleIssues
    | IDraftIssues
    | IModuleIssues
    | IDraftIssues
    | IProjectViewIssues
    | IProfileIssues
    | IWorkspaceIssues,
  subGroupBy: string | null,
  groupBy: string | null,
  issueMap: IIssueMap,
  issueWithIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined,
  viewId: string | null = null // it can be moduleId, cycleId
) => {
  if (!issueMap || !issueWithIds || !source || !destination || !workspaceSlug || !projectId) return;

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
    !destinationSubGroupByColumnId
  )
    return;

  if (destinationGroupByColumnId === "issue-trash-box") {
    const sourceIssues: string[] = subGroupBy
      ? (issueWithIds as TSubGroupedIssues)[sourceSubGroupByColumnId][sourceGroupByColumnId]
      : (issueWithIds as TGroupedIssues)[sourceGroupByColumnId];

    const [removed] = sourceIssues.splice(source.index, 1);

    if (removed) {
      if (viewId) return await store?.removeIssue(workspaceSlug, projectId, removed); //, viewId);
      else return await store?.removeIssue(workspaceSlug, projectId, removed);
    }
  } else {
    const sourceIssues = subGroupBy
      ? (issueWithIds as TSubGroupedIssues)[sourceSubGroupByColumnId][sourceGroupByColumnId]
      : (issueWithIds as TGroupedIssues)[sourceGroupByColumnId];
    const destinationIssues = subGroupBy
      ? (issueWithIds as TSubGroupedIssues)[sourceSubGroupByColumnId][destinationGroupByColumnId]
      : (issueWithIds as TGroupedIssues)[destinationGroupByColumnId];

    const [removed] = sourceIssues.splice(source.index, 1);
    const removedIssueDetail = issueMap[removed];

    updateIssue = {
      id: removedIssueDetail?.id,
      project_id: removedIssueDetail?.project_id,
    };

    // for both horizontal and vertical dnd
    updateIssue = {
      ...updateIssue,
      ...handleSortOrder(destinationIssues, destination.index, issueMap),
    };

    if (subGroupBy && sourceSubGroupByColumnId && destinationSubGroupByColumnId) {
      if (sourceSubGroupByColumnId === destinationSubGroupByColumnId) {
        if (sourceGroupByColumnId != destinationGroupByColumnId) {
          if (groupBy === "state") updateIssue = { ...updateIssue, state_id: destinationGroupByColumnId };
          if (groupBy === "priority") updateIssue = { ...updateIssue, priority: destinationGroupByColumnId };
        }
      } else {
        if (subGroupBy === "state")
          updateIssue = {
            ...updateIssue,
            state_id: destinationSubGroupByColumnId,
            priority: destinationGroupByColumnId,
          };
        if (subGroupBy === "priority")
          updateIssue = {
            ...updateIssue,
            state_id: destinationGroupByColumnId,
            priority: destinationSubGroupByColumnId,
          };
      }
    } else {
      // for horizontal dnd
      if (sourceColumnId != destinationColumnId) {
        if (groupBy === "state") updateIssue = { ...updateIssue, state_id: destinationGroupByColumnId };
        if (groupBy === "priority") updateIssue = { ...updateIssue, priority: destinationGroupByColumnId };
      }
    }

    if (updateIssue && updateIssue?.id) {
      if (viewId)
        return await store?.updateIssue(workspaceSlug, updateIssue.project_id, updateIssue.id, updateIssue, viewId);
      else return await store?.updateIssue(workspaceSlug, updateIssue.project_id, updateIssue.id, updateIssue);
    }
  }
};
