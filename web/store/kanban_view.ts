import { action, computed, makeObservable } from "mobx";
// types
import { RootStore } from "./root";
import { IIssueType } from "./issue";

export interface IIssueKanBanViewStore {
  handleDragDrop: (source: any, destination: any) => void;
}

class IssueKanBanViewStore implements IIssueKanBanViewStore {
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // computed
      canUserDragDrop: computed,
      canUserDragDropVertically: computed,
      canUserDragDropHorizontally: computed,

      // actions
      handleDragDrop: action,
    });

    this.rootStore = _rootStore;
  }

  get canUserDragDrop() {
    if (
      this.rootStore?.issueFilter?.userDisplayFilters?.group_by &&
      this.rootStore?.issueFilter?.userDisplayFilters?.order_by &&
      ["state", "priority"].includes(this.rootStore?.issueFilter?.userDisplayFilters?.group_by) &&
      this.rootStore?.issueFilter?.userDisplayFilters?.order_by === "sort_order"
    ) {
      return true;
    }
    return false;
  }
  get canUserDragDropVertically() {
    return true;
  }
  get canUserDragDropHorizontally() {
    return true;
  }

  handleDragDrop = async (source: any, destination: any) => {
    const workspaceSlug = this.rootStore?.workspace?.workspaceSlug;
    const projectId = this.rootStore?.project?.projectId;
    const issueType: IIssueType | null = this.rootStore?.issue?.getIssueType;
    const issueLayout = this.rootStore?.issueFilter?.userDisplayFilters?.layout || null;

    const sortOrderDefaultValue = 10000;

    if (workspaceSlug && projectId && issueType && issueLayout === "kanban" && this.rootStore.issue.getIssues) {
      const currentIssues: any = this.rootStore.issue.getIssues;

      let updateIssue: any = {
        workspaceSlug: workspaceSlug,
        projectId: projectId,
      };

      // user can drag the issues from any direction
      if (this.canUserDragDrop) {
        // vertical
        if (source.droppableId === destination.droppableId) {
          const _columnId = source.droppableId;
          const _issues = currentIssues[_columnId];

          // update the sort order
          if (destination.index === 0) {
            updateIssue = { ...updateIssue, sort_order: _issues[destination.index].sort_order - sortOrderDefaultValue };
          } else if (destination.index === _issues.length - 1) {
            updateIssue = { ...updateIssue, sort_order: _issues[destination.index].sort_order + sortOrderDefaultValue };
          } else {
            updateIssue = {
              ...updateIssue,
              sort_order: (_issues[destination.index - 1].sort_order + _issues[destination.index].sort_order) / 2,
            };
          }

          // update the mobx state array
          const [removed] = _issues.splice(source.index, 1);
          _issues.splice(destination.index, 0, { ...removed, sort_order: updateIssue.sort_order });
          updateIssue = { ...updateIssue, issueId: removed?.id };

          currentIssues[_columnId] = _issues;
        }

        // horizontal
        if (source.droppableId != destination.droppableId) {
          const _sourceColumnId = source.droppableId;
          const _destinationColumnId = destination.droppableId;

          const _sourceIssues = currentIssues[_sourceColumnId];
          const _destinationIssues = currentIssues[_destinationColumnId];

          if (_destinationIssues.length > 0) {
            if (destination.index === 0) {
              updateIssue = {
                ...updateIssue,
                sort_order: _destinationIssues[destination.index].sort_order - sortOrderDefaultValue,
                state: destination?.droppableId,
              };
            } else if (destination.index === _destinationIssues.length - 1) {
              updateIssue = {
                ...updateIssue,
                sort_order: _destinationIssues[destination.index].sort_order + sortOrderDefaultValue,
                state: destination?.droppableId,
              };
            } else {
              updateIssue = {
                ...updateIssue,
                sort_order:
                  (_destinationIssues[destination.index - 1].sort_order +
                    _destinationIssues[destination.index].sort_order) /
                  2,
                state: destination?.droppableId,
              };
            }
          } else {
            updateIssue = {
              ...updateIssue,
              sort_order: sortOrderDefaultValue,
              state: destination?.droppableId,
            };
          }

          const [removed] = _sourceIssues.splice(source.index, 1);
          _destinationIssues.splice(destination.index, 0, {
            ...removed,
            state: destination?.droppableId,
            sort_order: updateIssue.sort_order,
          });
          updateIssue = { ...updateIssue, issueId: removed?.id };

          currentIssues[_sourceColumnId] = _sourceIssues;
          currentIssues[_destinationColumnId] = _destinationIssues;
        }
      }

      // user can drag the issues only vertically
      if (this.canUserDragDropVertically && source.droppableId === destination.droppableId) {
      }

      // user can drag the issues only horizontally
      if (this.canUserDragDropHorizontally && source.droppableId != destination.droppableId) {
      }

      this.rootStore.issue.issues = {
        ...this.rootStore?.issue.issues,
        [projectId]: {
          ...this.rootStore?.issue.issues?.[projectId],
          [issueType]: {
            ...this.rootStore?.issue.issues?.[projectId]?.[issueType],
            [issueType]: currentIssues,
          },
        },
      };

      // this.rootStore.issueDetail?.updateIssueAsync(
      //   updateIssue.workspaceSlug,
      //   updateIssue.projectId,
      //   updateIssue.issueId,
      //   updateIssue
      // );
    }
  };
}

export default IssueKanBanViewStore;
