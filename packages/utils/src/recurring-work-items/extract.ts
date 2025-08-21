// plane imports
import { TRecurringWorkItem, TWorkItemBlueprintFormData } from "@plane/types";
// local imports
import { extractWorkItemFormDataBlueprint } from "../templates/work-item/blueprint/extract";
import {
  sanitizeWorkItemFormDataBlueprint,
  TSanitizeWorkItemFormDataParams,
  TWorkItemSanitizationResult,
} from "../templates/work-item/blueprint/sanitize";

/**
 * Parameters for extracting and sanitizing recurring work item form data
 */
type TExtractAndSanitizeRecurringWorkItemFormDataParams = TSanitizeWorkItemFormDataParams & {
  recurringWorkItemData: TRecurringWorkItem["workitem_blueprint"];
};

/**
 * Extracts and sanitizes recurring work item form data
 * Returns both valid data and invalid IDs for UI error handling
 * @param params.recurringWorkItemData - The recurring work item data
 * @param params.getProjectStateIds - Function to get valid project state IDs
 * @param params.getProjectLabelIds - Function to get valid project label IDs
 * @param params.getProjectModuleIds - Function to get valid project module IDs
 * @param params.getProjectMemberIds - Function to get valid project member IDs
 * @returns The sanitized recurring work item form data
 */
export const extractAndSanitizeRecurringWorkItemFormData = (
  params: TExtractAndSanitizeRecurringWorkItemFormDataParams
): TWorkItemSanitizationResult<TWorkItemBlueprintFormData> => {
  const { recurringWorkItemData, getProjectStateIds, getProjectLabelIds, getProjectModuleIds, getProjectMemberIds } =
    params;

  const extractedData = extractWorkItemFormDataBlueprint(recurringWorkItemData);

  const recurringWorkItemResult = sanitizeWorkItemFormDataBlueprint(extractedData, {
    getProjectStateIds,
    getProjectLabelIds,
    getProjectModuleIds,
    getProjectMemberIds,
  });

  // Return both sanitized data and invalid IDs
  return {
    valid: {
      ...recurringWorkItemResult.valid,
    },
    invalid: {
      ...recurringWorkItemResult.invalid,
    },
  };
};
