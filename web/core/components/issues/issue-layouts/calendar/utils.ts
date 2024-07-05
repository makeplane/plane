import { TIssue } from "@plane/types";

export const handleDragDrop = async (
  issueId: string,
  sourceDate: string,
  destinationDate: string,
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  updateIssue?: (projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>
) => {
  if (!workspaceSlug || !projectId || !updateIssue) return;

  if (sourceDate === destinationDate) return;

  const updatedIssue = {
    id: issueId,
    target_date: destinationDate,
  };

  return await updateIssue(projectId, updatedIssue.id, updatedIssue);
};
