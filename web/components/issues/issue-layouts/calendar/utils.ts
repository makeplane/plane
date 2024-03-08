import { DraggableLocation } from "@hello-pangea/dnd";
import { TGroupedIssues, IIssueMap, TIssue } from "@plane/types";

export const handleDragDrop = async (
  source: DraggableLocation,
  destination: DraggableLocation,
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  issueMap: IIssueMap,
  issueWithIds: TGroupedIssues,
  updateIssue?: (projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>
) => {
  if (!issueMap || !issueWithIds || !workspaceSlug || !projectId || !updateIssue) return;

  const sourceColumnId = source?.droppableId || null;
  const destinationColumnId = destination?.droppableId || null;

  if (!workspaceSlug || !projectId || !sourceColumnId || !destinationColumnId) return;

  if (sourceColumnId === destinationColumnId) return;

  // horizontal
  if (sourceColumnId != destinationColumnId) {
    const sourceIssues = issueWithIds[sourceColumnId] || [];

    const [removed] = sourceIssues.splice(source.index, 1);
    const removedIssueDetail = issueMap[removed];

    const updatedIssue = {
      id: removedIssueDetail?.id,
      target_date: destinationColumnId,
    };

    return await updateIssue(projectId, updatedIssue.id, updatedIssue);
  }
};
