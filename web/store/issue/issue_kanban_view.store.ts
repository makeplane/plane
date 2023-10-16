import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IIssueType } from "./issue.store";
import { IUser } from "types";

export interface IIssueKanBanViewStore {
  kanBanToggle: {
    groupByHeaderMinMax: string[];
    subgroupByIssuesVisibility: string[];
  };
  // computed
  canUserDragDrop: boolean;
  canUserDragDropVertically: boolean;
  canUserDragDropHorizontally: boolean;
  // actions
  handleKanBanToggle: (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => void;
  handleSwimlaneDragDrop: (source: any, destination: any) => void;
  handleDragDrop: (source: any, destination: any) => void;
}

export class IssueKanBanViewStore implements IIssueKanBanViewStore {
  kanBanToggle: {
    groupByHeaderMinMax: string[];
    subgroupByIssuesVisibility: string[];
  } = { groupByHeaderMinMax: [], subgroupByIssuesVisibility: [] };
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      kanBanToggle: observable,
      // computed
      canUserDragDrop: computed,
      canUserDragDropVertically: computed,
      canUserDragDropHorizontally: computed,

      // actions
      handleKanBanToggle: action,
      handleSwimlaneDragDrop: action,
      handleDragDrop: action,
    });

    this.rootStore = _rootStore;
  }

  get canUserDragDrop() {
    if (
      this.rootStore?.issueFilter?.userDisplayFilters?.order_by &&
      this.rootStore?.issueFilter?.userDisplayFilters?.order_by === "sort_order" &&
      this.rootStore?.issueFilter?.userDisplayFilters?.group_by &&
      ["state", "priority"].includes(this.rootStore?.issueFilter?.userDisplayFilters?.group_by)
    ) {
      if (!this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by) return true;
      if (
        this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by &&
        ["state", "priority"].includes(this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by)
      )
        return true;
    }
    return false;
  }

  get canUserDragDropVertically() {
    return false;
  }

  get canUserDragDropHorizontally() {
    return false;
  }

  handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    this.kanBanToggle = {
      ...this.kanBanToggle,
      [toggle]: this.kanBanToggle[toggle].includes(value)
        ? this.kanBanToggle[toggle].filter((v) => v !== value)
        : [...this.kanBanToggle[toggle], value],
    };
  };

  handleSwimlaneDragDrop = async (source: any, destination: any) => {
    const workspaceSlug = this.rootStore?.workspace?.workspaceSlug;
    const projectId = this.rootStore?.project?.projectId;
    const issueType: IIssueType | null = this.rootStore?.issue?.getIssueType;
    const issueLayout = this.rootStore?.issueFilter?.userDisplayFilters?.layout || null;
    const currentIssues: any = this.rootStore.issue.getIssues;

    const sortOrderDefaultValue = 65535;

    if (workspaceSlug && projectId && issueType && issueLayout === "kanban" && currentIssues) {
      // update issue payload
      let updateIssue: any = {
        workspaceSlug: workspaceSlug,
        projectId: projectId,
      };

      // source, destination group and sub group id
      let droppableSourceColumnId = source.droppableId;
      droppableSourceColumnId = droppableSourceColumnId ? droppableSourceColumnId.split("__") : null;
      let droppableDestinationColumnId = destination.droppableId;
      droppableDestinationColumnId = droppableDestinationColumnId ? droppableDestinationColumnId.split("__") : null;
      if (!droppableSourceColumnId || !droppableDestinationColumnId) return null;

      const source_group_id: string = droppableSourceColumnId[0];
      const source_sub_group_id: string = droppableSourceColumnId[1] === "null" ? null : droppableSourceColumnId[1];

      const destination_group_id: string = droppableDestinationColumnId[0];
      const destination_sub_group_id: string =
        droppableDestinationColumnId[1] === "null" ? null : droppableDestinationColumnId[1];

      if (source_sub_group_id === destination_sub_group_id) {
        if (source_group_id === destination_group_id) {
          const _issues = currentIssues[source_sub_group_id][source_group_id];

          // update the sort order
          if (destination.index === 0) {
            updateIssue = {
              ...updateIssue,
              sort_order: _issues[destination.index].sort_order - sortOrderDefaultValue,
            };
          } else if (destination.index === _issues.length - 1) {
            updateIssue = {
              ...updateIssue,
              sort_order: _issues[destination.index].sort_order + sortOrderDefaultValue,
            };
          } else {
            updateIssue = {
              ...updateIssue,
              sort_order: (_issues[destination.index - 1].sort_order + _issues[destination.index].sort_order) / 2,
            };
          }

          const [removed] = _issues.splice(source.index, 1);
          _issues.splice(destination.index, 0, { ...removed, sort_order: updateIssue.sort_order });
          updateIssue = { ...updateIssue, issueId: removed?.id };
          currentIssues[source_sub_group_id][source_group_id] = _issues;
        }

        if (source_group_id != destination_group_id) {
          const _sourceIssues = currentIssues[source_sub_group_id][source_group_id];
          let _destinationIssues = currentIssues[destination_sub_group_id][destination_group_id] || [];

          if (_destinationIssues && _destinationIssues.length > 0) {
            if (destination.index === 0) {
              updateIssue = {
                ...updateIssue,
                sort_order: _destinationIssues[destination.index].sort_order - sortOrderDefaultValue,
              };
            } else if (destination.index === _destinationIssues.length) {
              updateIssue = {
                ...updateIssue,
                sort_order: _destinationIssues[destination.index - 1].sort_order + sortOrderDefaultValue,
              };
            } else {
              updateIssue = {
                ...updateIssue,
                sort_order:
                  (_destinationIssues[destination.index - 1].sort_order +
                    _destinationIssues[destination.index].sort_order) /
                  2,
              };
            }
          } else {
            updateIssue = {
              ...updateIssue,
              sort_order: sortOrderDefaultValue,
            };
          }

          let issueStatePriority = {};
          if (this.rootStore.issueFilter?.userDisplayFilters?.group_by === "state") {
            updateIssue = { ...updateIssue, state: destination_group_id };
            issueStatePriority = { ...issueStatePriority, state: destination_group_id };
          }
          if (this.rootStore.issueFilter?.userDisplayFilters?.group_by === "priority") {
            updateIssue = { ...updateIssue, priority: destination_group_id };
            issueStatePriority = { ...issueStatePriority, priority: destination_group_id };
          }

          const [removed] = _sourceIssues.splice(source.index, 1);
          if (_destinationIssues && _destinationIssues.length > 0)
            _destinationIssues.splice(destination.index, 0, {
              ...removed,
              sort_order: updateIssue.sort_order,
              ...issueStatePriority,
            });
          else
            _destinationIssues = [
              ..._destinationIssues,
              { ...removed, sort_order: updateIssue.sort_order, ...issueStatePriority },
            ];
          updateIssue = { ...updateIssue, issueId: removed?.id };

          currentIssues[source_sub_group_id][source_group_id] = _sourceIssues;
          currentIssues[destination_sub_group_id][destination_group_id] = _destinationIssues;
        }
      }

      if (source_sub_group_id != destination_sub_group_id) {
        const _sourceIssues = currentIssues[source_sub_group_id][source_group_id];
        let _destinationIssues = currentIssues[destination_sub_group_id][destination_group_id] || [];

        if (_destinationIssues && _destinationIssues.length > 0) {
          if (destination.index === 0) {
            updateIssue = {
              ...updateIssue,
              sort_order: _destinationIssues[destination.index].sort_order - sortOrderDefaultValue,
            };
          } else if (destination.index === _destinationIssues.length) {
            updateIssue = {
              ...updateIssue,
              sort_order: _destinationIssues[destination.index - 1].sort_order + sortOrderDefaultValue,
            };
          } else {
            updateIssue = {
              ...updateIssue,
              sort_order:
                (_destinationIssues[destination.index - 1].sort_order +
                  _destinationIssues[destination.index].sort_order) /
                2,
            };
          }
        } else {
          updateIssue = {
            ...updateIssue,
            sort_order: sortOrderDefaultValue,
          };
        }

        let issueStatePriority = {};
        if (source_group_id === destination_group_id) {
          if (this.rootStore.issueFilter?.userDisplayFilters?.sub_group_by === "state") {
            updateIssue = { ...updateIssue, state: destination_sub_group_id };
            issueStatePriority = { ...issueStatePriority, state: destination_sub_group_id };
          }
          if (this.rootStore.issueFilter?.userDisplayFilters?.sub_group_by === "priority") {
            updateIssue = { ...updateIssue, priority: destination_sub_group_id };
            issueStatePriority = { ...issueStatePriority, priority: destination_sub_group_id };
          }
        } else {
          if (this.rootStore.issueFilter?.userDisplayFilters?.sub_group_by === "state") {
            updateIssue = { ...updateIssue, state: destination_sub_group_id, priority: destination_group_id };
            issueStatePriority = {
              ...issueStatePriority,
              state: destination_sub_group_id,
              priority: destination_group_id,
            };
          }
          if (this.rootStore.issueFilter?.userDisplayFilters?.sub_group_by === "priority") {
            updateIssue = { ...updateIssue, state: destination_group_id, priority: destination_sub_group_id };
            issueStatePriority = {
              ...issueStatePriority,
              state: destination_group_id,
              priority: destination_sub_group_id,
            };
          }
        }

        const [removed] = _sourceIssues.splice(source.index, 1);
        if (_destinationIssues && _destinationIssues.length > 0)
          _destinationIssues.splice(destination.index, 0, {
            ...removed,
            sort_order: updateIssue.sort_order,
            ...issueStatePriority,
          });
        else
          _destinationIssues = [
            ..._destinationIssues,
            { ...removed, sort_order: updateIssue.sort_order, ...issueStatePriority },
          ];

        updateIssue = { ...updateIssue, issueId: removed?.id };
        currentIssues[source_sub_group_id][source_group_id] = _sourceIssues;
        currentIssues[destination_sub_group_id][destination_group_id] = _destinationIssues;
      }

      const reorderedIssues = {
        ...this.rootStore?.issue.issues,
        [projectId]: {
          ...this.rootStore?.issue.issues?.[projectId],
          [issueType]: {
            ...this.rootStore?.issue.issues?.[projectId]?.[issueType],
            [issueType]: currentIssues,
          },
        },
      };

      runInAction(() => {
        this.rootStore.issue.issues = { ...reorderedIssues };
      });

      this.rootStore.issueDetail?.updateIssue(
        updateIssue.workspaceSlug,
        updateIssue.projectId,
        updateIssue.issueId,
        updateIssue,
        {} as IUser
      );
    }
  };

  handleDragDrop = async (source: any, destination: any) => {
    const workspaceSlug = this.rootStore?.workspace?.workspaceSlug;
    const projectId = this.rootStore?.project?.projectId;
    const issueType: IIssueType | null = this.rootStore?.issue?.getIssueType;
    const issueLayout = this.rootStore?.issueFilter?.userDisplayFilters?.layout || null;
    const currentIssues: any = this.rootStore.issue.getIssues;

    const sortOrderDefaultValue = 65535;

    if (workspaceSlug && projectId && issueType && issueLayout === "kanban" && currentIssues) {
      // update issue payload
      let updateIssue: any = {
        workspaceSlug: workspaceSlug,
        projectId: projectId,
      };

      // source, destination group and sub group id
      let droppableSourceColumnId = source.droppableId;
      droppableSourceColumnId = droppableSourceColumnId ? droppableSourceColumnId.split("__") : null;
      let droppableDestinationColumnId = destination.droppableId;
      droppableDestinationColumnId = droppableDestinationColumnId ? droppableDestinationColumnId.split("__") : null;
      if (!droppableSourceColumnId || !droppableDestinationColumnId) return null;

      const source_group_id: string = droppableSourceColumnId[0];
      const destination_group_id: string = droppableDestinationColumnId[0];

      if (this.canUserDragDrop) {
        // vertical
        if (source_group_id === destination_group_id) {
          const _issues = currentIssues[source_group_id];

          // update the sort order
          if (destination.index === 0) {
            updateIssue = {
              ...updateIssue,
              sort_order: _issues[destination.index].sort_order - sortOrderDefaultValue,
            };
          } else if (destination.index === _issues.length - 1) {
            updateIssue = {
              ...updateIssue,
              sort_order: _issues[destination.index].sort_order + sortOrderDefaultValue,
            };
          } else {
            updateIssue = {
              ...updateIssue,
              sort_order: (_issues[destination.index - 1].sort_order + _issues[destination.index].sort_order) / 2,
            };
          }

          const [removed] = _issues.splice(source.index, 1);
          _issues.splice(destination.index, 0, { ...removed, sort_order: updateIssue.sort_order });
          updateIssue = { ...updateIssue, issueId: removed?.id };
          currentIssues[source_group_id] = _issues;
        }

        // horizontal
        if (source_group_id != destination_group_id) {
          const _sourceIssues = currentIssues[source_group_id];
          let _destinationIssues = currentIssues[destination_group_id] || [];

          if (_destinationIssues && _destinationIssues.length > 0) {
            if (destination.index === 0) {
              updateIssue = {
                ...updateIssue,
                sort_order: _destinationIssues[destination.index].sort_order - sortOrderDefaultValue,
              };
            } else if (destination.index === _destinationIssues.length) {
              updateIssue = {
                ...updateIssue,
                sort_order: _destinationIssues[destination.index - 1].sort_order + sortOrderDefaultValue,
              };
            } else {
              updateIssue = {
                ...updateIssue,
                sort_order:
                  (_destinationIssues[destination.index - 1].sort_order +
                    _destinationIssues[destination.index].sort_order) /
                  2,
              };
            }
          } else {
            updateIssue = {
              ...updateIssue,
              sort_order: sortOrderDefaultValue,
            };
          }

          let issueStatePriority = {};
          if (this.rootStore.issueFilter?.userDisplayFilters?.group_by === "state") {
            updateIssue = { ...updateIssue, state: destination_group_id };
            issueStatePriority = { ...issueStatePriority, state: destination_group_id };
          }
          if (this.rootStore.issueFilter?.userDisplayFilters?.group_by === "priority") {
            updateIssue = { ...updateIssue, priority: destination_group_id };
            issueStatePriority = { ...issueStatePriority, priority: destination_group_id };
          }

          const [removed] = _sourceIssues.splice(source.index, 1);
          if (_destinationIssues && _destinationIssues.length > 0)
            _destinationIssues.splice(destination.index, 0, {
              ...removed,
              sort_order: updateIssue.sort_order,
              ...issueStatePriority,
            });
          else
            _destinationIssues = [
              ..._destinationIssues,
              { ...removed, sort_order: updateIssue.sort_order, ...issueStatePriority },
            ];
          updateIssue = { ...updateIssue, issueId: removed?.id };

          currentIssues[source_group_id] = _sourceIssues;
          currentIssues[destination_group_id] = _destinationIssues;
        }
      }

      // user can drag the issues only vertically
      if (this.canUserDragDropVertically && destination_group_id === destination_group_id) {
      }

      // user can drag the issues only horizontally
      if (this.canUserDragDropHorizontally && destination_group_id != destination_group_id) {
      }

      const reorderedIssues = {
        ...this.rootStore?.issue.issues,
        [projectId]: {
          ...this.rootStore?.issue.issues?.[projectId],
          [issueType]: {
            ...this.rootStore?.issue.issues?.[projectId]?.[issueType],
            [issueType]: currentIssues,
          },
        },
      };

      runInAction(() => {
        this.rootStore.issue.issues = { ...reorderedIssues };
      });

      this.rootStore.issueDetail?.updateIssue(
        updateIssue.workspaceSlug,
        updateIssue.projectId,
        updateIssue.issueId,
        updateIssue,
        {} as IUser
      );
    }
  };
}
