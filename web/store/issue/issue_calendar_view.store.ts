import { action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IIssueType } from "./issue.store";

export interface IIssueCalendarViewStore {
  // actions
  handleDragDrop: (source: any, destination: any) => void;
}

export class IssueCalendarViewStore implements IIssueCalendarViewStore {
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // actions
      handleDragDrop: action,
    });

    this.rootStore = _rootStore;
  }

  handleDragDrop = async (source: any, destination: any) => {
    const workspaceSlug = this.rootStore?.workspace?.workspaceSlug;
    const projectId = this.rootStore?.project?.projectId;
    const issueType: IIssueType | null = this.rootStore?.issue?.getIssueType;
    const issueLayout = this.rootStore?.issueFilter?.userDisplayFilters?.layout || null;
    const currentIssues: any = this.rootStore.issue.getIssues;

    if (workspaceSlug && projectId && issueType && issueLayout === "calendar" && currentIssues) {
      // update issue payload
      let updateIssue: any = {
        workspaceSlug: workspaceSlug,
        projectId: projectId,
      };

      const droppableSourceColumnId = source?.droppableId || null;
      const droppableDestinationColumnId = destination?.droppableId || null;

      if (droppableSourceColumnId === droppableDestinationColumnId) return;

      // horizontal
      if (droppableSourceColumnId != droppableDestinationColumnId) {
        const _sourceIssues = currentIssues[droppableSourceColumnId];
        let _destinationIssues = currentIssues[droppableDestinationColumnId] || [];

        const [removed] = _sourceIssues.splice(source.index, 1);

        if (_destinationIssues && _destinationIssues.length > 0)
          _destinationIssues.splice(destination.index, 0, {
            ...removed,
            target_date: droppableDestinationColumnId,
          });
        else _destinationIssues = [..._destinationIssues, { ...removed, target_date: droppableDestinationColumnId }];

        updateIssue = { ...updateIssue, issueId: removed?.id, target_date: droppableDestinationColumnId };

        currentIssues[droppableSourceColumnId] = _sourceIssues;
        currentIssues[droppableDestinationColumnId] = _destinationIssues;
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
        updateIssue
      );
    }

    return;
  };
}
