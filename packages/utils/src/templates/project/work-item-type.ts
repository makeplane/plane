import { v4 as uuidv4 } from "uuid";
// plane imports
import {
  EIssuePropertyType,
  IIssueProperty,
  IIssuePropertyOption,
  IIssueType,
  IWorkItemTypeStoreInstanceServices,
  TCreateIssuePropertyOptionPayload,
  TCreateIssuePropertyPayload,
  TCreateIssueTypePayload,
  TDeleteIssuePropertyOptionPayload,
  TDeleteIssuePropertyPayload,
  TIssuePropertyOption,
  TIssuePropertyResponse,
  TIssueType,
  TUpdateIssuePropertyPayload,
  TUpdateIssueTypePayload,
} from "@plane/types";

/**
 * Mock create work item type
 * @param payload
 * @param payload.workspaceSlug - The workspace slug
 * @param payload.projectId - The project id
 * @param payload.data - The work item type data
 * @returns
 */
export const mockCreateWorkItemType = async ({
  workspaceSlug,
  projectId,
  data,
}: TCreateIssueTypePayload): Promise<TIssueType> =>
  Promise.resolve({
    id: data.id ?? uuidv4(),
    name: data.name,
    description: data.description,
    logo_props: data.logo_props,
    is_active: data.is_active,
    is_default: data.is_default,
    level: data.level,
    is_epic: data.is_epic,
    project_ids: [projectId],
    workspace: workspaceSlug, // Attaching the workspace slug instead of workspace id, it doesn't matter for the template service
    created_at: new Date(),
    created_by: data.created_by,
    updated_at: new Date(),
    updated_by: data.updated_by,
  });

/**
 * Mock update work item type
 * @param getWorkItemTypeById - The function to get the work item type by id
 * @param payload
 * @param payload.issueTypeId - The issue type id
 * @param payload.data - The work item type data
 * @returns
 */
export const mockUpdateWorkItemType = async (
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined,
  { issueTypeId, data }: TUpdateIssueTypePayload
): Promise<IIssueType> => {
  const currentWorkItemType = issueTypeId ? getWorkItemTypeById(issueTypeId) : undefined;
  if (!currentWorkItemType) {
    throw new Error("Work item type not found");
  }
  return Promise.resolve({
    ...currentWorkItemType,
    ...data,
    updated_at: new Date(),
  });
};

/**
 * Merge property options - This is a helper function used to merge the current options with the new options (Create or Update)
 * @param params
 * @param params.workspaceSlug - The workspace slug
 * @param params.projectId - The project id
 * @param params.customPropertyId - The custom property id
 * @param params.currentOptions - The current options
 * @param params.newOptions - The new options
 * @param params.createOptionInstance - The function to create the option instance
 * @returns
 */
const mergePropertyOptions = async ({
  workspaceSlug,
  projectId,
  customPropertyId,
  currentOptions,
  newOptions,
  createOptionInstance,
}: {
  workspaceSlug: string;
  projectId?: string;
  customPropertyId: string;
  currentOptions: IIssuePropertyOption[];
  newOptions: Partial<TIssuePropertyOption>[];
  createOptionInstance: (option: TIssuePropertyOption) => IIssuePropertyOption;
}) => {
  const result: IIssuePropertyOption[] = [];
  // Map of existing options by ID for quick lookup
  const existingOptionsMap = new Map<string, IIssuePropertyOption>();
  currentOptions.forEach((option) => {
    if (option.id) {
      existingOptionsMap.set(option.id, option);
    }
  });

  const optionsToCreate: Promise<TIssuePropertyOption>[] = [];
  for (const newOption of newOptions) {
    if (newOption.id && existingOptionsMap.has(newOption.id)) {
      const existingOption = existingOptionsMap.get(newOption.id);
      // Update the existing option with new values
      existingOptionsMap.delete(newOption.id);
      if (existingOption) {
        result.push({
          ...existingOption,
          ...newOption,
        });
      }
    }
    // If it doesn't exist, create new option
    else {
      optionsToCreate.push(
        mockCreateCustomPropertyOption({
          workspaceSlug,
          projectId,
          customPropertyId,
          data: newOption,
        })
      );
    }
  }

  const createdOptions = await Promise.all(optionsToCreate);
  for (const option of createdOptions) {
    result.push(createOptionInstance(option));
  }

  // Add any remaining current options that weren't in the new options list
  existingOptionsMap.forEach((remainingOption) => {
    result.push(remainingOption);
  });

  return result;
};

/**
 * Mock create custom property
 * @param payload
 * @param payload.workspaceSlug - The workspace slug
 * @param payload.projectId - The project id
 * @param payload.issueTypeId - The issue type id
 * @param payload.data - The custom property data
 */
export const mockCreateCustomProperty = async ({
  workspaceSlug,
  projectId,
  issueTypeId,
  data,
}: TCreateIssuePropertyPayload): Promise<TIssuePropertyResponse> => {
  const customPropertyId = data.id ?? uuidv4();
  return Promise.resolve({
    id: customPropertyId,
    name: data.name,
    display_name: data.display_name,
    description: data.description,
    logo_props: data.logo_props,
    sort_order: data.sort_order,
    relation_type: data.relation_type,
    is_required: data.is_required,
    default_value: data.default_value,
    is_active: data.is_active,
    issue_type: data.issue_type || issueTypeId,
    is_multi: data.is_multi,
    created_at: new Date(),
    created_by: data.created_by,
    updated_at: new Date(),
    updated_by: data.updated_by,
    property_type: data.property_type,
    settings: data.settings,
    options: (
      await Promise.all(
        data.options.map((option) =>
          mockCreateCustomPropertyOption({
            workspaceSlug,
            projectId,
            customPropertyId,
            data: option,
          })
        )
      )
    )
      .filter(Boolean)
      .filter((option) => option.id),
  });
};

/**
 * Mock update custom property
 * @param getCustomPropertyById - The function to get the custom property by id
 * @param createOptionInstance - The function to create the option instance
 * @param payload
 * @param payload.workspaceSlug - The workspace slug
 * @param payload.projectId - The project id
 * @param payload.customPropertyId - The custom property id
 * @param payload.data - The custom property data
 */
export const mockUpdateCustomProperty = async (
  getCustomPropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined,
  createOptionInstance: (option: TIssuePropertyOption) => IIssuePropertyOption,
  { workspaceSlug, projectId, customPropertyId, data }: TUpdateIssuePropertyPayload
): Promise<TIssuePropertyResponse> => {
  const currentCustomProperty = customPropertyId ? getCustomPropertyById(customPropertyId) : undefined;
  if (!currentCustomProperty || !currentCustomProperty.id) {
    throw new Error("Custom property not found");
  }

  const { options, ...rest } = data;

  const updatedOptions = await mergePropertyOptions({
    workspaceSlug,
    projectId,
    customPropertyId: currentCustomProperty.id,
    currentOptions: currentCustomProperty.propertyOptions,
    newOptions: options,
    createOptionInstance,
  });

  const updatedCustomProperty = await Promise.resolve({
    ...currentCustomProperty,
    ...rest,
    propertyOptions: updatedOptions,
    updated_at: new Date(),
  });

  return {
    ...updatedCustomProperty,
    options: updatedCustomProperty?.propertyOptions
      .map((option) => option.asJSON)
      .filter(Boolean)
      .filter((option) => option.id),
  };
};

/**
 * Mock delete custom property
 * @param payload
 * @param payload.workspaceSlug - The workspace slug
 * @param payload.projectId - The project id
 * @param payload.customPropertyId - The custom property id
 */
export const mockDeleteCustomProperty = async ({}: TDeleteIssuePropertyPayload): Promise<void> => Promise.resolve();

/**
 * Mock create custom property option
 * @param payload
 * @param payload.customPropertyId - The custom property id
 * @param payload.data - The custom property option data
 */
export const mockCreateCustomPropertyOption = async ({
  customPropertyId,
  data,
}: TCreateIssuePropertyOptionPayload): Promise<TIssuePropertyOption> =>
  Promise.resolve({
    id: data.id ?? uuidv4(),
    name: data.name,
    sort_order: data.sort_order,
    property: customPropertyId,
    description: data.description,
    logo_props: data.logo_props,
    is_active: true,
    parent: data.parent,
    is_default: data.is_default,
    created_at: new Date(),
    created_by: data.created_by,
    updated_at: new Date(),
    updated_by: data.updated_by,
  });

/**
 * Mock delete custom property option
 * @param payload
 * @param payload.workspaceSlug - The workspace slug
 * @param payload.projectId - The project id
 * @param payload.customPropertyId - The custom property id
 */
export const mockDeleteCustomPropertyOption = async ({}: TDeleteIssuePropertyOptionPayload): Promise<void> =>
  Promise.resolve();

type TCreateWorkItemTypeInstanceParams = {
  services: IWorkItemTypeStoreInstanceServices;
  issueTypeData: TIssueType;
};

export type TMockCreateWorkItemTypeInstanceParams = {
  workspaceSlug: string;
  projectId: string;
  data: Partial<TIssueType>;
  createWorkItemTypeInstance: (params: TCreateWorkItemTypeInstanceParams) => IIssueType;
  createOptionInstance: (option: TIssuePropertyOption) => IIssuePropertyOption;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
  getCustomPropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

/**
 * Mock create work item type instance
 * @param params
 * @param params.workspaceSlug - The workspace slug
 * @param params.projectId - The project id
 * @param params.data - The work item type data
 * @param params.createWorkItemTypeInstance - The function to create the work item type instance
 * @param params.createOptionInstance - The function to create the option instance
 * @param params.getWorkItemTypeById - The function to get the work item type by id
 * @param params.getCustomPropertyById - The function to get the custom property by id
 * @returns Work item type instance
 */
export const mockCreateWorkItemTypeInstance = async ({
  workspaceSlug,
  projectId,
  data,
  createWorkItemTypeInstance,
  createOptionInstance,
  getWorkItemTypeById,
  getCustomPropertyById,
}: TMockCreateWorkItemTypeInstanceParams): Promise<IIssueType> =>
  await mockCreateWorkItemType({
    // Passing projectTemplateId, just in case we need any reference to the project template.
    workspaceSlug,
    projectId,
    data: data,
  }).then((workItemType) =>
    createWorkItemTypeInstance({
      services: {
        workItemType: {
          create: mockCreateWorkItemType,
          update: (payload) => mockUpdateWorkItemType(getWorkItemTypeById, payload),
        },
        customProperty: {
          create: mockCreateCustomProperty,
          update: (payload) => mockUpdateCustomProperty(getCustomPropertyById, createOptionInstance, payload),
          deleteProperty: mockDeleteCustomProperty,
        },
        customPropertyOption: {
          create: mockCreateCustomPropertyOption,
          deleteOption: mockDeleteCustomPropertyOption,
        },
      },
      issueTypeData: workItemType,
    })
  );

export type TMockCreateDefaultWorkItemTypeInstanceParams = Omit<TMockCreateWorkItemTypeInstanceParams, "data">;

/**
 * Mock create default work item type instance
 * @param params
 * @param params.workspaceSlug - The workspace slug
 * @param params.projectId - The project id
 * @param params.createWorkItemTypeInstance - The function to create the work item type instance
 * @param params.createOptionInstance - The function to create the option instance
 * @param params.getWorkItemTypeById - The function to get the work item type by id
 * @param params.getCustomPropertyById - The function to get the custom property by id
 * @returns Default work item type instance
 */
export const mockCreateDefaultWorkItemTypeInstance = async (
  params: TMockCreateDefaultWorkItemTypeInstanceParams
): Promise<IIssueType> =>
  await mockCreateWorkItemTypeInstance({
    ...params,
    data: {
      workspace: params.workspaceSlug,
      project_ids: [params.projectId],
      name: "Task",
      is_default: true,
      is_active: true,
      is_epic: false,
      level: 0,
      description: "Default work item type with the option to add new properties",
      logo_props: {
        in_use: "icon",
        icon: { color: "#ffffff", background_color: "#6695FF" },
      },
    },
  });

/**
 * Mock create project epic work item type instance
 * @param params
 * @param params.workspaceSlug - The workspace slug
 * @param params.projectId - The project id
 * @param params.createWorkItemTypeInstance - The function to create the work item type instance
 * @param params.createOptionInstance - The function to create the option instance
 * @param params.getWorkItemTypeById - The function to get the work item type by id
 * @param params.getCustomPropertyById - The function to get the custom property by id
 * @returns Default work item type instance
 */
export const mockCreateProjectEpicWorkItemTypeInstance = async (
  params: TMockCreateDefaultWorkItemTypeInstanceParams
): Promise<IIssueType> =>
  await mockCreateWorkItemTypeInstance({
    ...params,
    data: {
      workspace: params.workspaceSlug,
      project_ids: [params.projectId],
      name: "Epic",
      is_default: false,
      is_active: true,
      is_epic: true,
      level: 1,
    },
  });
