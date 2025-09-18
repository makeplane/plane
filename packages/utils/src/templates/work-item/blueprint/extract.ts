import { v4 as uuidv4 } from "uuid";
// plane imports
import {
  EIssuePropertyType,
  IIssueProperty,
  IIssueType,
  TIssuePropertyValues,
  TWorkItemBlueprint,
  TWorkItemBlueprintFormData,
  TWorkItemPropertyBlueprint,
} from "@plane/types";
// local imports
import { extractIds } from "../../../common";
import { getPropertiesDefaultValues } from "../../../work-item-properties";
import { sanitizeCustomPropertyValues } from "./sanitize";

/**
 * Extracts work item form data blueprint from the work item data
 * @param workItemData - The work item data
 * @returns The work item form data blueprint
 */
export const extractWorkItemFormDataBlueprint = (workItemData: TWorkItemBlueprint): TWorkItemBlueprintFormData => ({
  id: workItemData.id ?? uuidv4(),
  name: workItemData.name,
  description_html: workItemData.description_html,
  project_id: workItemData.project,
  type_id: workItemData.type?.id ?? null,
  state_id: workItemData.state?.id ?? null,
  priority: workItemData.priority,
  assignee_ids: extractIds(workItemData.assignees) ?? [],
  label_ids: extractIds(workItemData.labels) ?? [],
  module_ids: extractIds(workItemData.modules) ?? [],
});

/**
 * Extracts custom property values from form data
 * @param properties - The properties
 * @returns The custom property values
 */
const extractCustomPropertyValuesFromFormData = (properties: TWorkItemPropertyBlueprint[]): TIssuePropertyValues =>
  properties.reduce<TIssuePropertyValues>((acc, property) => {
    if (property.id !== undefined) {
      acc[property.id] = property.values;
    }
    return acc;
  }, {});

/**
 * Parameters for extracting and sanitizing custom property values from form data
 */
type TExtractAndSanitizeCustomPropertyValuesFormDataParams = {
  properties: TWorkItemPropertyBlueprint[];
  getPropertyById: <T extends EIssuePropertyType>(propertyId: string) => IIssueProperty<T> | undefined;
};

/**
 * Extracts and sanitizes custom property values from form data
 * @param params - The parameters for extracting and sanitizing custom property values
 * @param params.properties - The properties
 * @param params.getPropertyById - The function to get the property by id
 * @returns The sanitized custom property values
 */
export const extractAndSanitizeCustomPropertyValuesFormData = (
  params: TExtractAndSanitizeCustomPropertyValuesFormDataParams
): TIssuePropertyValues => {
  const { properties, getPropertyById } = params;
  // Extract custom property values from form data
  const customPropertyValues = extractCustomPropertyValuesFromFormData(properties);
  // Sanitize custom property values
  const sanitizedCustomPropertyValues = sanitizeCustomPropertyValues({
    customPropertyValues,
    getPropertyById,
  });
  return sanitizedCustomPropertyValues;
};

/**
 * Processes work item custom properties by sanitizing and merging with defaults
 * @param workItemTypeId - The work item type id
 * @param properties - The properties
 * @param getIssueTypeById - The function to get the issue type by id
 * @param getPropertiesDefaultValues - The function to get the properties default values
 */
export const processWorkItemCustomProperties = (
  workItemTypeId: string | undefined,
  properties: TWorkItemPropertyBlueprint[],
  getIssueTypeById: (id: string) => IIssueType | undefined
): TIssuePropertyValues | null => {
  if (!workItemTypeId) return null;

  const workItemType = getIssueTypeById(workItemTypeId);
  const getPropertyById = workItemType?.getPropertyById;

  if (!getPropertyById) return null;

  // Get the sanitized custom property values form data
  const sanitizedCustomPropertyValues = extractAndSanitizeCustomPropertyValuesFormData({
    properties,
    getPropertyById,
  });

  // Merge with default values
  return {
    ...getPropertiesDefaultValues(workItemType?.activeProperties ?? []),
    ...sanitizedCustomPropertyValues,
  };
};
