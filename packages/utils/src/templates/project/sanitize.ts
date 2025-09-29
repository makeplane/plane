import { TProjectTemplateFormData } from "@plane/types";
import { isValidId, partitionValidIds } from "../../common";
import { sanitizeMultipleWorkItemFormDataBlueprints } from "../work-item";
import { projectTemplateFormGettersHelpers } from "./helper";
import { TMockCreateWorkItemTypeInstanceParams } from "./work-item-type";

export type TSanitizeProjectCreationFormParams = {
  workspaceSlug: string;
  getWorkspaceProjectStateIds: (workspaceId: string) => string[] | undefined;
  getWorkspaceMemberIds: (workspaceSlug: string) => string[];
};

export type TSanitizeProjectTemplateFormDataParams = TSanitizeProjectCreationFormParams &
  Omit<TMockCreateWorkItemTypeInstanceParams, "data">;

type TSanitizeProjectCreationFormDataParams = TSanitizeProjectCreationFormParams & {
  workspaceId: string;
  extractedData: Partial<TProjectTemplateFormData>;
};

/**
 * Sanitizes project creation form data
 * Returns both valid data and invalid IDs for UI error handling
 */
export const sanitizeProjectCreationFormData = (params: TSanitizeProjectCreationFormDataParams) => {
  const { extractedData, workspaceId, workspaceSlug, getWorkspaceProjectStateIds, getWorkspaceMemberIds } = params;

  // Get valid IDs for the project template
  const workspaceProjectStateIds = getWorkspaceProjectStateIds(workspaceId) ?? [];
  const workspaceUserIds = getWorkspaceMemberIds(workspaceSlug) ?? [];

  // Check project state ID validity
  const projectStateId = extractedData.state_id;
  const isProjectStateValid = isValidId(projectStateId, workspaceProjectStateIds);
  const invalidProjectStateId = isProjectStateValid ? null : projectStateId;

  // Check project lead validity
  const projectLead = extractedData.project_lead;
  const isProjectLeadValid = isValidId(
    typeof projectLead === "string" ? projectLead : projectLead?.id,
    workspaceUserIds
  );
  const invalidProjectLead = isProjectLeadValid
    ? null
    : typeof projectLead === "string"
      ? projectLead
      : projectLead?.id;

  // Check project members validity
  const { valid: validMemberIds, invalid: invalidMemberIds } = partitionValidIds(
    extractedData.members ?? [],
    workspaceUserIds
  );

  // Check work items validity
  const helpers = projectTemplateFormGettersHelpers(extractedData);
  const workItemsResult = sanitizeMultipleWorkItemFormDataBlueprints(extractedData.workitems ?? [], {
    getProjectStateIds: () => helpers.stateIds,
    getProjectLabelIds: () => helpers.labelIds,
    getProjectModuleIds: () => [],
    getProjectMemberIds: () => helpers.memberIds,
  });

  // Return both sanitized data and invalid IDs
  return {
    valid: {
      ...extractedData,
      state_id: isProjectStateValid ? projectStateId : undefined,
      project_lead: isProjectLeadValid ? projectLead : undefined,
      members: validMemberIds,
      workitems: workItemsResult.valid,
    },
    invalid: {
      state_id: invalidProjectStateId,
      project_lead: invalidProjectLead,
      members: invalidMemberIds,
      ...(Object.keys(workItemsResult.invalid).length > 0 ? { workitems: workItemsResult.invalid } : {}),
    },
  };
};
