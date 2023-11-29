import { DraggableLocation } from "@hello-pangea/dnd";
import { IProjectIssuesStore } from "./project-issues/project/issue.store";
import { IModuleIssuesStore } from "./project-issues/module/issue.store";
import { ICycleIssuesStore } from "./project-issues/cycle/issue.store";
import { IViewIssuesStore } from "./project-issues/project-view/issue.store";
import { IProjectDraftIssuesStore } from "./project-issues/draft/issue.store";
import { IProfileIssuesStore } from "./profile/issue.store";
import { IGroupedIssues, IIssueResponse, ISubGroupedIssues, TUnGroupedIssues } from "./types";

export interface IKanBanHelpers {
  // actions
  handleDragDrop: (
    source: DraggableLocation | null,
    destination: DraggableLocation | null,
    workspaceSlug: string,
    projectId: string, // projectId for all views or user id in profile issues
    store:
      | IProjectIssuesStore
      | IModuleIssuesStore
      | ICycleIssuesStore
      | IViewIssuesStore
      | IProjectDraftIssuesStore
      | IProfileIssuesStore,
    subGroupBy: string | null,
    groupBy: string | null,
    issues: IIssueResponse | undefined,
    issueWithIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined,
    viewId?: string | null
  ) => void;
}

export class KanBanHelpers implements IKanBanHelpers {
  constructor() {}

  handleSortOrder = (destinationIssues: any, destinationIndex: any, issues: any) => {
    const sortOrderDefaultValue = 65535;
    let currentIssueState = {};

    if (destinationIssues && destinationIssues.length > 0) {
      if (destinationIndex === 0) {
        const destinationIssueId = destinationIssues[destinationIndex];
        currentIssueState = {
          ...currentIssueState,
          sort_order: issues[destinationIssueId].sort_order - sortOrderDefaultValue,
        };
      } else if (destinationIndex === destinationIssues.length) {
        const destinationIssueId = destinationIssues[destinationIndex - 1];
        currentIssueState = {
          ...currentIssueState,
          sort_order: issues[destinationIssueId].sort_order + sortOrderDefaultValue,
        };
      } else {
        const destinationTopIssueId = destinationIssues[destinationIndex - 1];
        const destinationBottomIssueId = destinationIssues[destinationIndex];
        currentIssueState = {
          ...currentIssueState,
          sort_order: (issues[destinationTopIssueId].sort_order + issues[destinationBottomIssueId].sort_order) / 2,
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

  handleDragDrop = async (
    source: DraggableLocation | null,
    destination: DraggableLocation | null,
    workspaceSlug: string,
    projectId: string, // projectId for all views or user id in profile issues
    store:
      | IProjectIssuesStore
      | IModuleIssuesStore
      | ICycleIssuesStore
      | IViewIssuesStore
      | IProjectDraftIssuesStore
      | IProfileIssuesStore,
    subGroupBy: string | null,
    groupBy: string | null,
    issues: IIssueResponse | undefined,
    issueWithIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined,
    viewId: string | null = null // it can be moduleId, cycleId
  ) => {
    if (!issues || !issueWithIds || !source || !destination) return;

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

      console.log("removed", removed);

      if (removed) {
        if (viewId) store?.removeIssue(workspaceSlug, projectId, removed, viewId);
        else store?.removeIssue(workspaceSlug, projectId, removed);
      }
    } else {
      const sourceIssues = subGroupBy
        ? (issueWithIds as ISubGroupedIssues)[sourceSubGroupByColumnId][sourceGroupByColumnId]
        : (issueWithIds as IGroupedIssues)[sourceGroupByColumnId];
      const destinationIssues = subGroupBy
        ? (issueWithIds as ISubGroupedIssues)[sourceSubGroupByColumnId][destinationGroupByColumnId]
        : (issueWithIds as IGroupedIssues)[destinationGroupByColumnId];

      const [removed] = sourceIssues.splice(source.index, 1);
      const removedIssueDetail = issues[removed];

      if (subGroupBy && sourceSubGroupByColumnId && destinationSubGroupByColumnId) {
        updateIssue = {
          id: removedIssueDetail?.id,
        };

        // for both horizontal and vertical dnd
        updateIssue = {
          ...updateIssue,
          ...this.handleSortOrder(destinationIssues, destination.index, issues),
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
          ...this.handleSortOrder(destinationIssues, destination.index, issues),
        };

        // for horizontal dnd
        if (sourceColumnId != destinationColumnId) {
          if (groupBy === "state") updateIssue = { ...updateIssue, state: destinationGroupByColumnId };
          if (groupBy === "priority") updateIssue = { ...updateIssue, priority: destinationGroupByColumnId };
        }
      }

      if (updateIssue && updateIssue?.id) {
        if (viewId) store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue, viewId);
        else store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue);
      }
    }
  };
}
