import { STATE_GROUPS } from "@plane/constants";
import {
  EIssuePropertyType,
  IIssueLabel,
  IIssueProperty,
  IIssueType,
  IModule,
  IState,
  TProject,
  TProjectTemplateFormData,
} from "@plane/types";

export type TProjectBlueprintDetails = Pick<TProject, "id" | "identifier" | "name" | "logo_props" | "module_view">;

export type TProjectTemplateFormGettersHelpers = {
  getCustomPropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
  getLabelById: (labelId: string) => IIssueLabel | null;
  getModuleById: (moduleId: string) => IModule | null;
  getProjectById: (projectId: string | undefined | null) => TProjectBlueprintDetails | undefined;
  getProjectDefaultStateId: (projectId: string) => string | undefined;
  getProjectDefaultWorkItemTypeId: (projectId: string) => string | undefined;
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
  getWorkItemTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>;
  isWorkItemTypeEntityEnabled: () => boolean;
  labelIds: string[];
  memberIds: string[];
  moduleIds: string[];
  projectId: string | undefined;
  stateIds: string[];
};

export const projectTemplateFormGettersHelpers = (
  project: Partial<TProjectTemplateFormData>
): TProjectTemplateFormGettersHelpers => ({
  /**
   * Get the custom property by id
   * @param customPropertyId - The custom property id
   * @returns The custom property
   */
  getCustomPropertyById: (customPropertyId: string) => {
    const allCustomProperties = Object.values(project.workitem_types ?? {}).flatMap(
      (workItemType) => workItemType.properties
    );
    return allCustomProperties.find((customProperty) => customProperty.id === customPropertyId);
  },

  /**
   * Get the label by id
   * @param labelId - The label id
   * @returns The label
   */
  getLabelById: (labelId: string) => project.labels?.find((label) => label.id === labelId) ?? null,

  /**
   * Get the module by id
   * @param moduleId - The module id
   * @returns The module
   */
  getModuleById: () => null,

  /**
   * Get the project by id
   * @returns The project
   */
  getProjectById: () => {
    if (!project.id || !project.logo_props) return undefined;
    const projectName = project.name?.trim() || "Unnamed Project";
    return {
      id: project.id,
      name: projectName,
      identifier: projectName.slice(0, 5).toUpperCase(),
      logo_props: project.logo_props,
      module_view: project.module_view ?? false,
    };
  },

  /**
   * Get the default work item type id
   * @returns The default work item type id
   */
  getProjectDefaultWorkItemTypeId: () =>
    Object.values(project.workitem_types ?? {}).find((workItemType) => workItemType.is_default)?.id,

  /**
   * Get the default state id
   * @returns The default state id
   */
  getProjectDefaultStateId: () => project.states?.find((state) => state.default)?.id,

  /**
   * Get the state by id
   * @param stateId - The state id
   * @returns The state
   */
  getStateById: (stateId: string | null | undefined) => project.states?.find((state) => state.id === stateId),

  /**
   * Get the work item type by id
   * @param workItemTypeId - The work item type id
   * @returns The work item type
   */
  getWorkItemTypeById: (workItemTypeId: string) => project.workitem_types?.[workItemTypeId],

  /**
   * Get the work item types
   * @param projectId - The project id
   * @param activeOnly - Whether to get only active work item types
   * @returns The work item types
   */
  getWorkItemTypes: (projectId: string, activeOnly: boolean) =>
    Object.entries(project.workitem_types ?? {}).reduce(
      (acc, [workItemTypeId, workItemType]) => {
        if (activeOnly && !workItemType.is_active) return acc;
        acc[workItemTypeId] = workItemType;
        return acc;
      },
      {} as Record<string, IIssueType>
    ),

  /**
   * Check if the work item type entity is enabled
   * @returns Whether the work item type entity is enabled
   */
  isWorkItemTypeEntityEnabled: () => project.is_issue_type_enabled ?? false,

  /**
   * Get the label ids
   * @returns The label ids
   */
  labelIds: project.labels?.map((label) => label.id) ?? [],

  /**
   * Get the member ids
   * @returns The member ids
   */
  memberIds: project.members ?? [],

  /**
   * Get the module ids
   * @returns The module ids
   */
  moduleIds: [],

  /**
   * Get the project id
   * @returns The project id
   */
  projectId: project?.id ?? undefined,

  /**
   * Get the state ids ordered by group
   * @returns The state ids
   */
  stateIds: project.states
    ? Object.keys(STATE_GROUPS)
        .flatMap((group) => project.states?.filter((state) => state.group === group).map((state) => state.id))
        .filter((id): id is string => id !== undefined)
        .filter(Boolean)
    : [],
});
