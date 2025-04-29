import { v4 as uuidv4 } from "uuid";
// plane imports
import { IIssueLabel } from "@plane/types";

/**
 * Mock create or update label
 * @param workspaceSlug - The workspace slug
 * @param projectId - The project id
 * @param data - The label data
 * @returns The label
 */
export const mockCreateOrUpdateLabel = async (
  workspaceSlug: string,
  projectId: string,
  data: Partial<IIssueLabel>
): Promise<IIssueLabel> =>
  Promise.resolve({
    id: data.id ?? uuidv4(),
    name: data.name ?? "",
    color: data.color ?? "",
    project_id: projectId,
    workspace_id: workspaceSlug,
    parent: data.parent ?? null,
    sort_order: data.sort_order ?? Math.floor(Math.random() * 65535),
  });
