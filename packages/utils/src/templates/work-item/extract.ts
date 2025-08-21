// plane imports
import { TWorkItemTemplate, TWorkItemTemplateFormData } from "@plane/types";
// local imports
import { extractWorkItemFormDataBlueprint } from "./blueprint/extract";
import {
  sanitizeMultipleWorkItemFormDataBlueprints,
  sanitizeWorkItemFormDataBlueprint,
  TSanitizeWorkItemFormDataParams,
  TWorkItemSanitizationResult,
} from "./blueprint/sanitize";

/**
 * Extracts work item form data from the template
 * @param workItemData - The work item data
 * @returns The work item form data
 */
export const extractWorkItemTemplateFormData = (
  workItemData: TWorkItemTemplate["template_data"]
): TWorkItemTemplateFormData => ({
  ...extractWorkItemFormDataBlueprint(workItemData),
  sub_workitems: workItemData.sub_workitems.map(extractWorkItemFormDataBlueprint),
});

/**
 * Parameters for extracting and sanitizing work item form data
 */
type TExtractAndSanitizeWorkItemTemplateFormDataParams = TSanitizeWorkItemFormDataParams & {
  workItemData: TWorkItemTemplate["template_data"];
};

/**
 * Extracts and sanitizes work item form data
 * Returns both valid data and invalid IDs for UI error handling
 * @param params.workItemData - The work item data
 * @param params.getProjectStateIds - Function to get valid project state IDs
 * @param params.getProjectLabelIds - Function to get valid project label IDs
 * @param params.getProjectModuleIds - Function to get valid project module IDs
 * @param params.getProjectMemberIds - Function to get valid project member IDs
 * @returns The sanitized work item form data
 */
export const extractAndSanitizeWorkItemTemplateFormData = (
  params: TExtractAndSanitizeWorkItemTemplateFormDataParams
): TWorkItemSanitizationResult<TWorkItemTemplateFormData> => {
  const { workItemData, getProjectStateIds, getProjectLabelIds, getProjectModuleIds, getProjectMemberIds } = params;

  // Extract base work item data first
  const extractedData = extractWorkItemTemplateFormData(workItemData);

  const { sub_workitems, ...mainWorkItemData } = extractedData;

  const mainWorkItemResult = sanitizeWorkItemFormDataBlueprint(mainWorkItemData, {
    getProjectStateIds,
    getProjectLabelIds,
    getProjectModuleIds,
    getProjectMemberIds,
  });

  // Sanitize sub work items using the flexible sanitization function
  const subWorkItemsResult = sanitizeMultipleWorkItemFormDataBlueprints(sub_workitems, {
    getProjectStateIds,
    getProjectLabelIds,
    getProjectModuleIds,
    getProjectMemberIds,
  });

  // Return both sanitized data and invalid IDs
  return {
    valid: {
      ...mainWorkItemResult.valid,
      sub_workitems: subWorkItemsResult.valid,
    },
    invalid: {
      ...mainWorkItemResult.invalid,
      ...(Object.keys(subWorkItemsResult.invalid).length > 0 ? { sub_workitems: subWorkItemsResult.invalid } : {}),
    },
  };
};
