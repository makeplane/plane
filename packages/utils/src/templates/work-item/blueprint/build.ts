import {
  EIssuePropertyType,
  IIssueLabel,
  IUserLite,
  IState,
  TIssuePropertyValues,
  TIssueType,
  TWorkItemBlueprintFormData,
  IIssueProperty,
  IModule,
  TWorkItemBlueprint,
  TWorkItemTypeBlueprint,
  TCustomPropertyBlueprint,
  TCustomPropertyWithValuesBlueprint,
  IIssuePropertyOption,
} from "@plane/types";

/**
 * Parameters for building work item data blueprint
 */
export type TBuildWorkItemBlueprintBaseParams = {
  workspaceId: string;
  customPropertyValues: TIssuePropertyValues;
  getWorkItemTypeById: (workItemTypeId: string) => TIssueType | undefined;
  getWorkItemPropertyById: (workItemPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
  getStateById: (stateId: string) => IState | undefined;
  getUserDetails: (userId: string) => IUserLite | undefined;
  getLabelById: (labelId: string) => IIssueLabel | null;
  getModuleById: (moduleId: string) => IModule | null;
};

type TBuildWorkItemBlueprintParams = {
  workItem: TWorkItemBlueprintFormData;
} & TBuildWorkItemBlueprintBaseParams;

/**
 * Builds the work item data blueprint
 * @param params - The parameters for building the work item data blueprint
 * @param params.workItem - The work item form data blueprint
 * @param params.workspaceId - The workspace id
 * @param params.customPropertyValues - The custom property values
 * @param params.getWorkItemTypeById - The function to get the work item type by id
 * @param params.getWorkItemPropertyById - The function to get the work item property by id
 * @param params.getStateById - The function to get the state by id
 */
export const buildWorkItemBlueprint = (params: TBuildWorkItemBlueprintParams): TWorkItemBlueprint => {
  const {
    workItem,
    workspaceId,
    customPropertyValues,
    getWorkItemTypeById,
    getWorkItemPropertyById,
    getStateById,
    getUserDetails,
    getLabelById,
    getModuleById,
  } = params;

  return {
    name: workItem.name,
    description_html: workItem.description_html,
    project: workItem.project_id,
    workspace: workspaceId,
    type: buildWorkItemTypeBlueprint(workItem.type_id, getWorkItemTypeById),
    state: buildStateBlueprint(workItem.state_id, getStateById),
    priority: workItem.priority,
    assignees: buildAssigneesBlueprint(workItem.assignee_ids, getUserDetails),
    labels: buildLabelsBlueprint(workItem.label_ids, getLabelById),
    modules: buildModulesBlueprint(workItem.module_ids ?? [], getModuleById),
    properties: buildWorkItemTypePropertiesWithValuesBlueprint(
      customPropertyValues,
      getWorkItemTypeById,
      getWorkItemPropertyById
    ),
  };
};

/**
 * Builds work item type blueprint
 * @param typeId - The work item type id
 * @param getWorkItemTypeById - The function to get the work item type by id
 * @returns The work item type blueprint
 */
export const buildWorkItemTypeBlueprint = (
  typeId: string | null | undefined,
  getWorkItemTypeById: TBuildWorkItemBlueprintBaseParams["getWorkItemTypeById"]
): TWorkItemBlueprint["type"] => {
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
 * Builds state blueprint
 * @param stateId - The state id
 * @param getStateById - The function to get the state by id
 * @returns The state blueprint
 */
const buildStateBlueprint = (
  stateId: string | null,
  getStateById: TBuildWorkItemBlueprintBaseParams["getStateById"]
): TWorkItemBlueprint["state"] => {
  const state = stateId ? getStateById(stateId) : undefined;

  if (!state) return {};
  return {
    id: state.id,
    name: state.name,
    group: state.group,
  };
};

/**
 * Builds assignees blueprint
 * @param assigneeIds - The assignee ids
 * @param getUserDetails - The function to get the user details
 * @returns The assignees blueprint
 */
const buildAssigneesBlueprint = (
  assigneeIds: string[],
  getUserDetails: TBuildWorkItemBlueprintBaseParams["getUserDetails"]
): TWorkItemBlueprint["assignees"] =>
  assigneeIds
    .map((assigneeId) => {
      const user = getUserDetails(assigneeId);
      if (!user) return null;
      return { id: user.id };
    })
    .filter((assignee): assignee is { id: string } => assignee !== null);

/**
 * Builds labels blueprint
 * @param labelIds - The label ids
 * @param getLabelById - The function to get the label by id
 * @returns The labels blueprint
 */
export const buildLabelsBlueprint = (
  labelIds: string[],
  getLabelById: TBuildWorkItemBlueprintBaseParams["getLabelById"]
): TWorkItemBlueprint["labels"] =>
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
 * Builds modules blueprint
 * @param moduleIds - The module ids
 * @param getModuleById - The function to get the module by id
 * @returns The modules blueprint
 */
const buildModulesBlueprint = (
  moduleIds: string[],
  getModuleById: TBuildWorkItemBlueprintBaseParams["getModuleById"]
): TWorkItemBlueprint["modules"] =>
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
 * Builds property options blueprint
 * @param propertyOptions - The property options
 * @returns The property options blueprint
 */
const buildPropertyOptionsBlueprint = (
  propertyOptions: IIssuePropertyOption[]
): TWorkItemBlueprint["properties"][number]["options"] =>
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
    .filter(Boolean) as TWorkItemBlueprint["properties"][number]["options"];

/**
 * Builds base custom property blueprint
 * @param propertyId - The property id
 * @param getWorkItemPropertyById - The function to get the work item property by id
 * @returns The custom property blueprint
 */
export const buildCustomPropertyBlueprint = (
  propertyId: string,
  getWorkItemPropertyById: TBuildWorkItemBlueprintBaseParams["getWorkItemPropertyById"]
): TCustomPropertyBlueprint | undefined => {
  const property = getWorkItemPropertyById(propertyId);
  if (!property) return undefined;
  return {
    id: property.id,
    name: property.name,
    issue_type: property.issue_type,
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
    options: buildPropertyOptionsBlueprint(property.propertyOptions),
  };
};

/**
 * Builds properties blueprint with values
 * @param customPropertyValues - The custom property values
 * @param getWorkItemPropertyById - The function to get the work item property by id
 * @returns The custom properties with values blueprint
 */
const buildCustomPropertiesWithValuesBlueprint = (
  customPropertyValues: TBuildWorkItemBlueprintBaseParams["customPropertyValues"],
  getWorkItemPropertyById: TBuildWorkItemBlueprintBaseParams["getWorkItemPropertyById"]
): TCustomPropertyWithValuesBlueprint[] => {
  const properties: TCustomPropertyWithValuesBlueprint[] = [];

  Object.keys(customPropertyValues).forEach((propertyId) => {
    // build custom property blueprint, if not available, skip
    const customPropertyBlueprint = buildCustomPropertyBlueprint(propertyId, getWorkItemPropertyById);
    if (!customPropertyBlueprint) return;

    properties.push({
      ...customPropertyBlueprint,
      values: customPropertyValues[propertyId] ?? [],
    });
  });
  return properties;
};

/**
 * Builds work item type properties with values blueprint
 * @param customPropertyValues - The custom property values
 * @param getWorkItemTypeById - The function to get the work item type by id
 * @param getWorkItemPropertyById - The function to get the work item property by id
 * @returns The work item type properties with values blueprint
 */
const buildWorkItemTypePropertiesWithValuesBlueprint = (
  customPropertyValues: TBuildWorkItemBlueprintBaseParams["customPropertyValues"],
  getWorkItemTypeById: TBuildWorkItemBlueprintBaseParams["getWorkItemTypeById"],
  getWorkItemPropertyById: TBuildWorkItemBlueprintBaseParams["getWorkItemPropertyById"]
): TWorkItemBlueprint["properties"] => {
  const properties: TWorkItemBlueprint["properties"] = [];
  const customPropertyWithValuesBlueprint = buildCustomPropertiesWithValuesBlueprint(
    customPropertyValues,
    getWorkItemPropertyById
  );

  customPropertyWithValuesBlueprint.forEach((customProperty) => {
    const property = customProperty.id ? getWorkItemPropertyById(customProperty.id) : undefined;
    const workItemTypeBlueprint = buildWorkItemTypeBlueprint(property?.issue_type, getWorkItemTypeById);
    // if property or work item type blueprint is not available, skip
    if (!property || !workItemTypeBlueprint || Object.keys(workItemTypeBlueprint).length === 0) return;

    properties.push({
      ...customProperty,
      type: workItemTypeBlueprint as TWorkItemTypeBlueprint,
    });
  });
  return properties;
};
