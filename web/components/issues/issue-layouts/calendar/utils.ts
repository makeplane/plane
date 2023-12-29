import { DraggableLocation } from "@hello-pangea/dnd";
import { ICycleIssues } from "store/issue/cycle";
import { IModuleIssues } from "store/issue/module";
import { IProjectIssues } from "store/issue/project";
import { IProjectViewIssues } from "store/issue/project-views";
import { TGroupedIssues, IIssueMap } from "@plane/types";

export const handleDragDrop = async (
  source: DraggableLocation,
  destination: DraggableLocation,
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  store: IProjectIssues | IModuleIssues | ICycleIssues | IProjectViewIssues,
  issueMap: IIssueMap,
  issueWithIds: TGroupedIssues,
  viewId: string | null = null // it can be moduleId, cycleId
) => {
  if (!issueMap || !issueWithIds || !workspaceSlug || !projectId) return;

  const sourceColumnId = source?.droppableId || null;
  const destinationColumnId = destination?.droppableId || null;

  if (!workspaceSlug || !projectId || !sourceColumnId || !destinationColumnId) return;

  if (sourceColumnId === destinationColumnId) return;

  // horizontal
  if (sourceColumnId != destinationColumnId) {
    const sourceIssues = issueWithIds[sourceColumnId] || [];

    const [removed] = sourceIssues.splice(source.index, 1);
    const removedIssueDetail = issueMap[removed];

    const updateIssue = {
      id: removedIssueDetail?.id,
      target_date: destinationColumnId,
    };

    if (viewId) return await store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue, viewId);
    else return await store?.updateIssue(workspaceSlug, projectId, updateIssue.id, updateIssue);
  }
};
