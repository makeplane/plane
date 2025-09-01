import { EIssuePropertyType, IIssueProperty, TIssuePropertyValues, TWorkItemBlueprintFormData } from "@plane/types";
// local imports
import { isValidId, partitionValidIds } from "../../../common";

/**
 * Type for invalid IDs in array of work item form data blueprints
 */
export type TWorkItemBlueprintFormDataListInvalid<T extends Array<TWorkItemBlueprintFormData>> = {
  [index: number]: TWorkItemSanitizationResult<T[number]>["invalid"];
};

/**
 * Generic sanitization result for any work item data
 * - 'valid' contains the sanitized data
 * - 'invalid' contains invalid IDs for each field
 */
export type TWorkItemSanitizationResult<T> = {
  valid: T;
  invalid: {
    [K in keyof T]?: T[K] extends string[] | null | undefined
      ? string[]
      : T[K] extends string | null | undefined
        ? string | null
        : T[K] extends Array<TWorkItemBlueprintFormData>
          ? TWorkItemBlueprintFormDataListInvalid<T[K]>
          : never;
  };
};

/**
 * Parameters for sanitizing work item form data
 * @param getProjectStateIds - Function to get valid project state IDs
 * @param getProjectLabelIds - Function to get valid project label IDs
 * @param getProjectModuleIds - Function to get valid project module IDs
 * @param getProjectMemberIds - Function to get valid project member IDs
 */
export type TSanitizeWorkItemFormDataParams = {
  getProjectStateIds: (projectId: string | null | undefined) => string[] | undefined;
  getProjectLabelIds: (projectId: string | null | undefined) => string[] | undefined;
  getProjectModuleIds: (projectId: string) => string[] | null;
  getProjectMemberIds: (projectId: string, includeGuestUsers: boolean) => string[] | null;
};

/**
 * Sanitizes work item form data blueprint
 * @param workItemData - The work item data
 * @param params - The parameters for sanitizing work item form data
 * @returns The sanitized work item data
 */
export const sanitizeWorkItemFormDataBlueprint = (
  workItemData: TWorkItemBlueprintFormData,
  params: TSanitizeWorkItemFormDataParams
): TWorkItemSanitizationResult<TWorkItemBlueprintFormData> => {
  const { getProjectStateIds, getProjectLabelIds, getProjectModuleIds, getProjectMemberIds } = params;

  // Get valid IDs for the project
  const project = workItemData.project_id;
  const projectStateIds = getProjectStateIds(project) ?? [];
  const projectLabelIds = getProjectLabelIds(project) ?? [];
  const projectModuleIds = project ? (getProjectModuleIds(project) ?? []) : [];
  const projectUserIds = project ? getProjectMemberIds(project, false) : [];

  // Check state ID validity
  const stateId = workItemData.state_id;
  const isStateValid = isValidId(stateId, projectStateIds);
  const invalidStateId = isStateValid ? null : stateId;

  // Check assignees validity
  const { valid: validAssigneeIds, invalid: invalidAssigneeIds } = partitionValidIds(
    workItemData.assignee_ids ?? [],
    projectUserIds ?? []
  );

  // Check labels validity
  const { valid: validLabelIds, invalid: invalidLabelIds } = partitionValidIds(
    workItemData.label_ids ?? [],
    projectLabelIds
  );

  // Check modules validity
  const { valid: validModuleIds, invalid: invalidModuleIds } = partitionValidIds(
    workItemData.module_ids ?? [],
    projectModuleIds
  );

  // Return both sanitized data and invalid IDs
  return {
    valid: {
      ...workItemData,
      state_id: isStateValid ? stateId : null,
      assignee_ids: validAssigneeIds,
      label_ids: validLabelIds,
      module_ids: validModuleIds,
    },
    invalid: {
      state_id: invalidStateId,
      assignee_ids: invalidAssigneeIds,
      label_ids: invalidLabelIds,
      module_ids: invalidModuleIds,
    },
  };
};

/**
 * Sanitizes multiple work item form data blueprints
 * @param workItemData - The work item data
 * @param params - The parameters for sanitizing work item form data
 * @param params.getProjectStateIds - Function to get valid project state IDs
 * @param params.getProjectLabelIds - Function to get valid project label IDs
 * @param params.getProjectModuleIds - Function to get valid project module IDs
 * @param params.getProjectMemberIds - Function to get valid project member IDs
 * @returns The sanitized work item data
 */
export const sanitizeMultipleWorkItemFormDataBlueprints = (
  workItemData: TWorkItemBlueprintFormData[],
  params: TSanitizeWorkItemFormDataParams
): {
  valid: TWorkItemBlueprintFormData[];
  invalid: { [index: number]: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"] };
} => {
  const sanitizedWorkItems: TWorkItemBlueprintFormData[] = [];
  const invalidWorkItems: { [index: number]: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"] } = {};

  workItemData.forEach((workItem, index) => {
    const result = sanitizeWorkItemFormDataBlueprint(workItem, params);

    sanitizedWorkItems.push(result.valid);

    // Only store invalid IDs if there are any
    const hasInvalidIds = Object.values(result.invalid).some(
      (value) => value !== null && (Array.isArray(value) ? value.length > 0 : true)
    );
    if (hasInvalidIds) {
      invalidWorkItems[index] = result.invalid;
    }
  });

  return {
    valid: sanitizedWorkItems,
    invalid: invalidWorkItems,
  };
};

/**
 * Parameters for sanitizing custom property values
 */
type TSanitizeCustomPropertyValuesParams = {
  customPropertyValues: TIssuePropertyValues;
  getPropertyById: <T extends EIssuePropertyType>(propertyId: string) => IIssueProperty<T> | undefined;
};

/**
 * Sanitizes custom property values by filtering out inactive properties
 * @param params - The parameters for sanitizing custom property values
 * @param params.customPropertyValues - The custom property values to sanitize
 * @param params.getPropertyById - The function to get the property by id
 * @returns The sanitized custom property values
 */
export const sanitizeCustomPropertyValues = (params: TSanitizeCustomPropertyValuesParams): TIssuePropertyValues => {
  const { customPropertyValues, getPropertyById } = params;

  return Object.keys(customPropertyValues).reduce<TIssuePropertyValues>((acc, propertyId) => {
    const property = getPropertyById(propertyId);
    if (property && property.id && property.is_active) {
      acc[propertyId] = customPropertyValues[propertyId];
    }
    return acc;
  }, {});
};
