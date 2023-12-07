export interface ICalendarHelpers {
  // actions
  handleDragDrop: (
    source: any,
    destination: any,
    workspaceSlug: string,
    projectId: string,
    store: any,
    issues: any,
    issueWithIds: any,
    viewId?: string | null
  ) => void;
}

export class CalendarHelpers implements ICalendarHelpers {
  constructor() {}

  handleDragDrop = async (
    source: any,
    destination: any,
    workspaceSlug: string,
    projectId: string,
    store: any,
    issues: any,
    issueWithIds: any,
    viewId: string | null = null // it can be moduleId, cycleId
  ) => {
    if (issues && issueWithIds) {
      const sourceColumnId = source?.droppableId || null;
      const destinationColumnId = destination?.droppableId || null;

      if (!workspaceSlug || !projectId || !sourceColumnId || !destinationColumnId) return;

      if (sourceColumnId === destinationColumnId) return;

      // horizontal
      if (sourceColumnId != destinationColumnId) {
        const sourceIssues = issueWithIds[sourceColumnId] || [];

        const [removed] = sourceIssues.splice(source.index, 1);
        const removedIssueDetail = issues[removed];

        const updateIssue = {
          id: removedIssueDetail?.id,
          target_date: destinationColumnId,
        };

        if (viewId) store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue, viewId);
        else store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue);
      }
    }
  };
}
