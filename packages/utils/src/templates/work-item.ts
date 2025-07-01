// plane imports
import {
  EIssuePropertyType,
  ETemplateType,
  IIssueLabel,
  IIssueProperty,
  IIssuePropertyOption,
  IModule,
  IState,
  IUserLite,
  TCustomPropertySchema,
  TCustomPropertyWithValuesSchema,
  TIssuePropertyValues,
  TIssueType,
  TWorkItemPropertySchema,
  TWorkItemTemplate,
  TWorkItemTemplateForm,
  TWorkItemTemplateFormData,
  TWorkItemTypeSchema,
} from "@plane/types";
// local imports
import { extractIds, isValidId, partitionValidIds } from "../common";
import { extractTemplateBasicFormData } from "./base";

export type TSanitizeWorkItemTemplateFormDataParams = {
  getProjectStateIds: (projectId: string | null | undefined) => string[] | undefined;
  getProjectLabelIds: (projectId: string | null | undefined) => string[] | undefined;
  getProjectModuleIds: (projectId: string) => string[] | null;
  getProjectMemberIds: (projectId: string, includeGuestUsers: boolean) => string[] | null;
};

export type TWorkItemTemplateDataToSanitizedFormDataParams = TSanitizeWorkItemTemplateFormDataParams & {
  template: TWorkItemTemplate;
};

/**
 * Converts a work item template to form data structure including invalid ID information
 */
export const workItemTemplateDataToSanitizedFormData = (
  data: TWorkItemTemplateDataToSanitizedFormDataParams
): { form: TWorkItemTemplateForm; invalidIds: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"] } => {
  const sanitizationResult = extractAndSanitizeWorkItemFormData({
    ...data,
    workItemData: data.template.template_data,
  });

  return {
    form: {
      template: extractTemplateBasicFormData(data.template),
      work_item: sanitizationResult.valid,
    },
    invalidIds: sanitizationResult.invalid,
  };
};

/**
 * Extracts work item form data from the template
 */
export const extractWorkItemFormData = (
  workItemData: TWorkItemTemplate["template_data"]
): TWorkItemTemplateFormData => ({
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

type TExtractAndSanitizeWorkItemFormDataParams = TSanitizeWorkItemTemplateFormDataParams & {
  workItemData: TWorkItemTemplate["template_data"];
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
        : never;
  };
};

/**
 * Extracts and sanitizes work item form data
 * Returns both valid data and invalid IDs for UI error handling
 */
export const extractAndSanitizeWorkItemFormData = (
  params: TExtractAndSanitizeWorkItemFormDataParams
): TWorkItemSanitizationResult<TWorkItemTemplateFormData> => {
  const { workItemData, getProjectStateIds, getProjectLabelIds, getProjectModuleIds, getProjectMemberIds } = params;

  // Extract base work item data first
  const extractedData = extractWorkItemFormData(workItemData);

  // Get valid IDs for the project
  const project = workItemData.project;
  const projectStateIds = getProjectStateIds(project) ?? [];
  const projectLabelIds = getProjectLabelIds(project) ?? [];
  const projectModuleIds = project ? (getProjectModuleIds(project) ?? []) : [];
  const projectUserIds = project ? getProjectMemberIds(project, false) : [];

  // Check state ID validity
  const stateId = extractedData.state_id;
  const isStateValid = isValidId(stateId, projectStateIds);
  const invalidStateId = isStateValid ? null : stateId;

  // Check assignees validity
  const { valid: validAssigneeIds, invalid: invalidAssigneeIds } = partitionValidIds(
    extractedData.assignee_ids ?? [],
    projectUserIds ?? []
  );

  // Check labels validity
  const { valid: validLabelIds, invalid: invalidLabelIds } = partitionValidIds(
    extractedData.label_ids ?? [],
    projectLabelIds
  );

  // Check modules validity
  const { valid: validModuleIds, invalid: invalidModuleIds } = partitionValidIds(
    extractedData.module_ids ?? [],
    projectModuleIds
  );

  // Return both sanitized data and invalid IDs
  return {
    valid: {
      ...extractedData,
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
 * Extracts custom property values from form data
 */
export const extractCustomPropertyValuesFromFormData = (properties: TWorkItemPropertySchema[]): TIssuePropertyValues =>
  properties.reduce<TIssuePropertyValues>((acc, property) => {
    if (property.id !== undefined) {
      acc[property.id] = property.values;
    }
    return acc;
  }, {});

type TExtractAndSanitizeCustomPropertyValuesFormDataParams = {
  properties: TWorkItemPropertySchema[];
  getPropertyById: <T extends EIssuePropertyType>(propertyId: string) => IIssueProperty<T> | undefined;
};

/**
 * Extracts and sanitizes custom property values from form data
 */
export const extractAndSanitizeCustomPropertyValuesFormData = (
  params: TExtractAndSanitizeCustomPropertyValuesFormDataParams
): TIssuePropertyValues => {
  const { properties, getPropertyById } = params;
  // Extract custom property values from form data
  const customPropertyValues = extractCustomPropertyValuesFromFormData(properties);
  // Sanitize custom property values
  const sanitizedCustomPropertyValues = Object.keys(customPropertyValues).reduce<TIssuePropertyValues>(
    (acc, propertyId) => {
      const property = getPropertyById(propertyId);
      if (property && property.id && property.is_active) {
        acc[propertyId] = customPropertyValues[propertyId];
      }
      return acc;
    },
    {}
  );
  return sanitizedCustomPropertyValues;
};

type TBuildWorkItemTemplateSchemaParams = {
  workspaceId: string;
  customPropertyValues: TIssuePropertyValues;
  getWorkItemTypeById: (workItemTypeId: string) => TIssueType | undefined;
  getWorkItemPropertyById: (workItemPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
  getStateById: (stateId: string) => IState | undefined;
  getUserDetails: (userId: string) => IUserLite | undefined;
  getLabelById: (labelId: string) => IIssueLabel | null;
  getModuleById: (moduleId: string) => IModule | null;
};

type TWorkItemTemplateFormDataParams = {
  formData: TWorkItemTemplateForm;
} & TBuildWorkItemTemplateSchemaParams;

/**
 * Converts form data back to the work item template format
 */
export const workItemTemplateFormDataToData = ({
  workspaceId,
  formData,
  customPropertyValues,
  getWorkItemTypeById,
  getWorkItemPropertyById,
  getStateById,
  getUserDetails,
  getLabelById,
  getModuleById,
}: TWorkItemTemplateFormDataParams): Partial<TWorkItemTemplate> => {
  const { template, work_item } = formData;

  return {
    name: template.name,
    short_description: template.short_description,
    template_type: ETemplateType.WORK_ITEM,
    template_data: buildWorkItemTemplateSchema({
      workspaceId,
      workItem: work_item,
      customPropertyValues,
      getWorkItemTypeById,
      getWorkItemPropertyById,
      getStateById,
      getUserDetails,
      getLabelById,
      getModuleById,
    }),
  };
};

type TBuildWorkItemTemplateDataParams = {
  workItem: TWorkItemTemplateForm["work_item"];
} & TBuildWorkItemTemplateSchemaParams;

/**
 * Builds the template schema
 */
const buildWorkItemTemplateSchema = ({
  workspaceId,
  workItem,
  customPropertyValues,
  getWorkItemTypeById,
  getWorkItemPropertyById,
  getStateById,
  getUserDetails,
  getLabelById,
  getModuleById,
}: TBuildWorkItemTemplateDataParams): TWorkItemTemplate["template_data"] => ({
  name: workItem.name,
  description_html: workItem.description_html,
  project: workItem.project_id,
  workspace: workspaceId,
  type: buildWorkItemTypeSchema(workItem.type_id, getWorkItemTypeById),
  state: buildStateSchema(workItem.state_id, getStateById),
  priority: workItem.priority,
  assignees: buildAssigneesSchema(workItem.assignee_ids, getUserDetails),
  labels: buildLabelsSchema(workItem.label_ids, getLabelById),
  modules: buildModulesSchema(workItem.module_ids ?? [], getModuleById),
  properties: buildWorkItemTypePropertiesWithValuesSchema(
    customPropertyValues,
    getWorkItemTypeById,
    getWorkItemPropertyById
  ),
});

/**
 * Builds work item type schema
 */
export const buildWorkItemTypeSchema = (
  typeId: string | null | undefined,
  getWorkItemTypeById: TBuildWorkItemTemplateDataParams["getWorkItemTypeById"]
): TWorkItemTemplate["template_data"]["type"] => {
  const workItemType = typeId ? getWorkItemTypeById(typeId) : undefined;

  if (!workItemType) return {};
  return {
    id: workItemType.id,
    name: workItemType.name,
    description: workItemType.description,
    logo_props: workItemType.logo_props,
    is_epic: workItemType.is_epic,
  };
};

/**
 * Builds state schema
 */
export const buildStateSchema = (
  stateId: string | null,
  getStateById: TBuildWorkItemTemplateDataParams["getStateById"]
): TWorkItemTemplate["template_data"]["state"] => {
  const state = stateId ? getStateById(stateId) : undefined;

  if (!state) return {};
  return {
    id: state.id,
    name: state.name,
    group: state.group,
  };
};

/**
 * Builds assignees schema
 */
export const buildAssigneesSchema = (
  assigneeIds: string[],
  getUserDetails: TBuildWorkItemTemplateDataParams["getUserDetails"]
): TWorkItemTemplate["template_data"]["assignees"] =>
  assigneeIds
    .map((assigneeId) => {
      const user = getUserDetails(assigneeId);
      if (!user) return null;
      return { id: user.id };
    })
    .filter((assignee): assignee is { id: string } => assignee !== null);

/**
 * Builds labels schema
 */
export const buildLabelsSchema = (
  labelIds: string[],
  getLabelById: TBuildWorkItemTemplateDataParams["getLabelById"]
): TWorkItemTemplate["template_data"]["labels"] =>
  labelIds
    .map((labelId) => {
      const label = getLabelById(labelId);
      if (!label) return null;
      return {
        id: label.id,
        name: label.name,
        color: label.color,
      };
    })
    .filter((label): label is { id: string; name: string; color: string } => label !== null);

/**
 * Builds modules schema
 */
export const buildModulesSchema = (
  moduleIds: string[],
  getModuleById: TBuildWorkItemTemplateDataParams["getModuleById"]
): TWorkItemTemplate["template_data"]["modules"] =>
  moduleIds
    .map((moduleId) => {
      const module = getModuleById(moduleId);
      if (!module) return null;
      return {
        id: module.id,
        name: module.name,
      };
    })
    .filter((module): module is { id: string; name: string } => module !== null);

/**
 * Builds property options schema
 */
export const buildPropertyOptionsSchema = (
  propertyOptions: IIssuePropertyOption[]
): TWorkItemTemplate["template_data"]["properties"][number]["options"] =>
  propertyOptions
    .map((propertyOption) => {
      if (!propertyOption || !propertyOption.is_active) return null;
      return {
        id: propertyOption.id,
        name: propertyOption.name,
        is_default: propertyOption.is_default,
        is_active: propertyOption.is_active,
        logo_props: propertyOption.logo_props ?? undefined,
      };
    })
    .filter(Boolean) as TWorkItemTemplate["template_data"]["properties"][number]["options"];

/**
 * Builds base custom property schema
 */
export const buildCustomPropertySchema = (
  propertyId: string,
  getWorkItemPropertyById: TBuildWorkItemTemplateDataParams["getWorkItemPropertyById"]
): TCustomPropertySchema | undefined => {
  const property = getWorkItemPropertyById(propertyId);
  if (!property) return undefined;
  return {
    id: property.id,
    name: property.name,
    display_name: property.display_name,
    description: property.description,
    property_type: property.property_type,
    relation_type: property.relation_type,
    logo_props: property.logo_props,
    is_required: property.is_required,
    settings: property.settings,
    is_active: property.is_active,
    is_multi: property.is_multi,
    default_value: property.default_value,
    options: buildPropertyOptionsSchema(property.propertyOptions),
  };
};

/**
 * Builds properties schema with values
 */
export const buildCustomPropertiesWithValuesSchema = (
  customPropertyValues: TBuildWorkItemTemplateSchemaParams["customPropertyValues"],
  getWorkItemPropertyById: TBuildWorkItemTemplateDataParams["getWorkItemPropertyById"]
): TCustomPropertyWithValuesSchema[] => {
  const properties: TCustomPropertyWithValuesSchema[] = [];

  Object.keys(customPropertyValues).forEach((propertyId) => {
    // build custom property schema, if not available, skip
    const customPropertySchema = buildCustomPropertySchema(propertyId, getWorkItemPropertyById);
    if (!customPropertySchema) return;

    properties.push({
      ...customPropertySchema,
      values: customPropertyValues[propertyId],
    });
  });
  return properties;
};

/**
 * Builds work item type properties with values schema
 */
export const buildWorkItemTypePropertiesWithValuesSchema = (
  customPropertyValues: TBuildWorkItemTemplateSchemaParams["customPropertyValues"],
  getWorkItemTypeById: TBuildWorkItemTemplateDataParams["getWorkItemTypeById"],
  getWorkItemPropertyById: TBuildWorkItemTemplateDataParams["getWorkItemPropertyById"]
): TWorkItemTemplate["template_data"]["properties"] => {
  const properties: TWorkItemTemplate["template_data"]["properties"] = [];
  const customPropertyWithValuesSchema = buildCustomPropertiesWithValuesSchema(
    customPropertyValues,
    getWorkItemPropertyById
  );

  customPropertyWithValuesSchema.forEach((customProperty) => {
    const property = customProperty.id ? getWorkItemPropertyById(customProperty.id) : undefined;
    const workItemTypeSchema = buildWorkItemTypeSchema(property?.issue_type, getWorkItemTypeById);
    // if property or work item type schema is not available, skip
    if (!property || !workItemTypeSchema || Object.keys(workItemTypeSchema).length === 0) return;

    properties.push({
      ...customProperty,
      type: workItemTypeSchema as TWorkItemTypeSchema,
    });
  });
  return properties;
};
