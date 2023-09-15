import { action, computed, makeObservable } from "mobx";
// types
import { RootStore } from "../root";

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
      this.rootStore?.issueFilters?.issueView &&
      this.rootStore?.issueFilters?.userFilters?.display_filters?.group_by &&
      this.rootStore?.issueFilters?.userFilters?.display_filters?.order_by &&
      !["my_issues"].includes(this.rootStore?.issueFilters?.issueView) &&
      ["state", "priority"].includes(this.rootStore?.issueFilters?.userFilters?.display_filters?.group_by) &&
      this.rootStore?.issueFilters?.userFilters?.display_filters?.order_by === "sort_order"
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
    const workspaceId = this.rootStore?.issueFilters?.workspaceId;
    const projectId = this.rootStore?.issueFilters?.projectId;
    const issueView = this.rootStore?.issueFilters?.issueView;
    const issueLayout = this.rootStore?.issueFilters?.userFilters?.display_filters?.layout;

    const sortOrderDefaultValue = 10000;

    if (
      this.rootStore?.issueView?.getIssues &&
      workspaceId &&
      projectId &&
      issueView &&
      issueLayout &&
      issueView != "my_issues"
    ) {
      const projectSortedIssues: any =
        this.rootStore?.issueView.issues?.[workspaceId]?.project_issues?.[projectId]?.[issueView]?.[issueLayout];

      let updateIssue: any = {
        workspaceId: workspaceId,
        projectId: projectId,
      };

      // user can drag the issues from any direction
      if (this.canUserDragDrop) {
        // vertical
        if (source.droppableId === destination.droppableId) {
          const _columnId = source.droppableId;
          const _issues = projectSortedIssues[_columnId];

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

          projectSortedIssues[_columnId] = _issues;
        }

        // horizontal
        if (source.droppableId != destination.droppableId) {
          const _sourceColumnId = source.droppableId;
          const _destinationColumnId = destination.droppableId;

          const _sourceIssues = projectSortedIssues[_sourceColumnId];
          const _destinationIssues = projectSortedIssues[_destinationColumnId];

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

          projectSortedIssues[_sourceColumnId] = _sourceIssues;
          projectSortedIssues[_destinationColumnId] = _destinationIssues;
        }
      }

      // user can drag the issues only vertically
      if (this.canUserDragDropVertically && source.droppableId === destination.droppableId) {
      }

      // user can drag the issues only horizontally
      if (this.canUserDragDropHorizontally && source.droppableId != destination.droppableId) {
      }

      this.rootStore.issueView.issues = {
        ...this.rootStore?.issueView.issues,
        [workspaceId]: {
          ...this.rootStore?.issueView.issues?.[workspaceId],
          project_issues: {
            ...this.rootStore?.issueView.issues?.[workspaceId]?.project_issues,
            [projectId]: {
              ...this.rootStore?.issueView.issues?.[workspaceId]?.project_issues?.[projectId],
              [issueView]: {
                ...this.rootStore?.issueView.issues?.[workspaceId]?.project_issues?.[projectId]?.[issueView],
                [issueLayout]: projectSortedIssues,
              },
            },
          },
        },
      };

      this.rootStore.issueDetail?.updateIssueAsync(
        updateIssue.workspaceId,
        updateIssue.projectId,
        updateIssue.issueId,
        updateIssue
      );
    }
  };
}

export default IssueKanBanViewStore;
