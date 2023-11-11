import { action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IIssueType } from "./project_view_issues.store";

export interface IProjectViewIssueCalendarViewStore {
  // actions
  handleDragDrop: (source: any, destination: any) => void;
}

export class ProjectViewIssueCalendarViewStore implements IProjectViewIssueCalendarViewStore {
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
    const viewId = this.rootStore?.projectViews?.viewId;
    const issueType: IIssueType | null = this.rootStore?.projectViewIssues?.getIssueType;
    const issueLayout = this.rootStore?.issueFilter?.userDisplayFilters?.layout || null;
    const currentIssues: any = this.rootStore.projectViewIssues.getIssues;

    if (workspaceSlug && projectId && viewId && issueType && issueLayout === "calendar" && currentIssues) {
      // update issue payload
      let updateIssue: any = {
        workspaceSlug: workspaceSlug,
        projectId: projectId,
      };

      const droppableSourceColumnId = source?.droppableId || null;
      const droppableDestinationColumnId = destination?.droppableId || null;

      if (droppableSourceColumnId === droppableDestinationColumnId) return;

      if (droppableSourceColumnId != droppableDestinationColumnId) {
        // horizontal
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
        ...this.rootStore?.projectViewIssues.viewIssues,
        [viewId]: {
          ...this.rootStore?.projectViewIssues.viewIssues?.[viewId],
          [issueType]: {
            ...this.rootStore?.projectViewIssues.viewIssues?.[viewId]?.[issueType],
            [issueType]: currentIssues,
          },
        },
      };

      runInAction(() => {
        this.rootStore.projectViewIssues.viewIssues = { ...reorderedIssues };
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
