import { v4 as uuidv4 } from "uuid";
import { TWorkItemBlueprintFormData } from "@plane/types";

type TMockCreateWorkItemBlueprintParams = {
  workspaceSlug: string;
  projectId: string | null | undefined;
  data: Partial<TWorkItemBlueprintFormData>;
};

/**
 * Mock create work item
 * @param params
 * @param params.workspaceSlug - The workspace slug
 * @param params.projectId - The project id
 * @param params.data - The work item data
 * @returns The work item
 */
export const mockCreateWorkItemBlueprint = async (
  params: TMockCreateWorkItemBlueprintParams
): Promise<TWorkItemBlueprintFormData> =>
  Promise.resolve({
    assignee_ids: params.data.assignee_ids ?? [],
    description_html: params.data.description_html,
    id: params.data.id ?? uuidv4(),
    label_ids: params.data.label_ids ?? [],
    module_ids: params.data.module_ids ?? [],
    name: params.data.name ?? "Untitled",
    priority: params.data.priority ?? "none",
    project_id: params.projectId ?? null,
    state_id: params.data.state_id ?? null,
    type_id: params.data.type_id ?? null,
    workspace: params.workspaceSlug,
  });
