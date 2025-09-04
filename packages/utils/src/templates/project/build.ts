// plane imports
import {
  IIssueLabel,
  IIssueType,
  IState,
  IUserLite,
  TIssuePropertyValues,
  TProjectMemberBlueprint,
  TProjectState,
  TProjectTemplate,
  TProjectTemplateForm,
} from "@plane/types";
// local imports
import {
  buildCustomPropertyBlueprint,
  buildLabelsBlueprint,
  buildWorkItemBlueprint,
  buildWorkItemTypeBlueprint,
  TBuildWorkItemBlueprintBaseParams,
} from "../work-item/blueprint/build";
import { projectTemplateFormGettersHelpers } from "./helper";

export type TBuildProjectTemplateBlueprintParams = {
  workspaceId: string;
  workItemListCustomPropertyValues: Record<string, TIssuePropertyValues>;
  getWorkspaceProjectStateById: (projectStateId: string) => TProjectState | undefined;
  getUserDetails: (userId: string) => IUserLite | undefined;
};

type TBuildProjectTemplateDataParams = {
  project: TProjectTemplateForm["project"];
} & TBuildProjectTemplateBlueprintParams;

/**
 * Builds the template blueprint
 */
export const buildProjectTemplateBlueprint = (
  params: TBuildProjectTemplateDataParams
): TProjectTemplate["template_data"] => {
  const { project, getUserDetails } = params;

  // helper method to get work item blueprint params
  const getProjectTemplateWorkItemBlueprintParams = (workItemId: string): TBuildWorkItemBlueprintBaseParams => {
    const projectGetterHelpers = projectTemplateFormGettersHelpers(project);
    return {
      workspaceId: params.workspaceId,
      customPropertyValues: params.workItemListCustomPropertyValues[workItemId] ?? {},
      getWorkItemTypeById: projectGetterHelpers.getWorkItemTypeById,
      getWorkItemPropertyById: projectGetterHelpers.getCustomPropertyById,
      getStateById: projectGetterHelpers.getStateById,
      getUserDetails,
      getLabelById: projectGetterHelpers.getLabelById,
      getModuleById: () => null,
    };
  };

  return {
    // basics
    name: project.name,
    description: project.description,
    network: project.network,
    default_assignee: {},
    project_lead: buildProjectLeadBlueprint(project.project_lead, getUserDetails),
    logo_props: project.logo_props,
    cover_asset: project.cover_image_url,
    // feature toggles
    cycle_view: project.cycle_view,
    module_view: project.module_view,
    issue_views_view: project.issue_views_view,
    page_view: project.page_view,
    intake_view: project.intake_view,
    intake_settings: project.intake_settings,
    is_time_tracking_enabled: project.is_time_tracking_enabled,
    is_issue_type_enabled: project.is_issue_type_enabled,
    is_project_updates_enabled: project.is_project_updates_enabled,
    is_epic_enabled: project.is_epic_enabled,
    is_workflow_enabled: project.is_workflow_enabled,
    guest_view_all_features: false,
    // timezone
    timezone: undefined,
    // automation
    archive_in: undefined,
    close_in: undefined,
    // workspace
    workspace: params.workspaceId,
    // project grouping
    priority: project.priority,
    project_state: buildWorkspaceProjectStateBlueprint(project.state_id, params.getWorkspaceProjectStateById),
    start_date: project.start_date,
    target_date: project.target_date,
    // attributes
    members: buildProjectMembersBlueprint(project.members ?? [], getUserDetails),
    states: buildProjectStatesBlueprint(project.states),
    labels: buildProjectLabelsBlueprint(project.labels),
    workflows: [],
    estimates: [],
    workitem_types: buildProjectWorkItemTypesBlueprint(project.workitem_types),
    epics: buildProjectEpicBlueprint(project.epics),
    workitems: project.workitems.map((workItem) =>
      buildWorkItemBlueprint({
        ...getProjectTemplateWorkItemBlueprintParams(workItem.id),
        workItem: workItem,
      })
    ),
  };
};

/**
 * Builds the workspace project state blueprint
 */
const buildWorkspaceProjectStateBlueprint = (
  projectStateId: string | undefined,
  getWorkspaceProjectStateById: TBuildProjectTemplateBlueprintParams["getWorkspaceProjectStateById"]
): TProjectTemplate["template_data"]["project_state"] => {
  if (!projectStateId) return {};
  const projectState = getWorkspaceProjectStateById(projectStateId);
  if (!projectState) return {};

  return {
    id: projectStateId,
    name: projectState.name,
    description: projectState.description,
    color: projectState.color,
    group: projectState.group,
    default: projectState.default,
  };
};

/**
 * Builds the member blueprint
 */
const buildMemberBlueprint = (
  memberId: string | undefined,
  getUserDetails: TBuildProjectTemplateBlueprintParams["getUserDetails"]
): TProjectMemberBlueprint | undefined => {
  if (!memberId) return undefined;
  const user = getUserDetails(memberId);
  if (!user) return undefined;
  return { id: user.id };
};

/**
 * Builds the project lead blueprint
 */
const buildProjectLeadBlueprint = (
  projectLeadId: string | IUserLite | null | undefined,
  getUserDetails: TBuildProjectTemplateBlueprintParams["getUserDetails"]
): TProjectTemplate["template_data"]["project_lead"] => {
  if (!projectLeadId) return {};
  if (typeof projectLeadId === "string") return buildMemberBlueprint(projectLeadId, getUserDetails) ?? {};
  return { id: projectLeadId.id };
};

/**
 * Builds members blueprint
 */
const buildProjectMembersBlueprint = (
  memberIds: string[],
  getUserDetails: TBuildProjectTemplateBlueprintParams["getUserDetails"]
): TProjectTemplate["template_data"]["members"] =>
  memberIds
    ?.map((memberId) => buildMemberBlueprint(memberId, getUserDetails))
    .filter((member): member is { id: string } => member !== null);

/**
 * Builds the project work item types blueprint
 */
const buildProjectWorkItemTypesBlueprint = (
  workItemTypes: Record<string, IIssueType>
): TProjectTemplate["template_data"]["workitem_types"] => {
  // helper methods to get work item type and custom property by id
  const getWorkItemTypeById = (workItemTypeId: string) => workItemTypes[workItemTypeId];
  const getCustomPropertyById = (customPropertyId: string) => {
    const allCustomProperties = Object.values(workItemTypes).flatMap((workItemType) => workItemType.properties);
    return allCustomProperties.find((customProperty) => customProperty.id === customPropertyId);
  };

  const workItemTypesBlueprint: TProjectTemplate["template_data"]["workitem_types"] = [];
  for (const workItemTypeId in workItemTypes) {
    // If work item type details are not available, skip
    const workItemType = getWorkItemTypeById(workItemTypeId);
    if (!workItemType) continue;

    // Build base work item type blueprint
    const baseWorkItemTypeBlueprint = buildWorkItemTypeBlueprint(workItemTypeId, getWorkItemTypeById);
    if (!baseWorkItemTypeBlueprint) continue;

    // Build properties blueprint
    const properties: TProjectTemplate["template_data"]["workitem_types"][number]["properties"] = [];
    for (const property of workItemType.properties) {
      const propertyBlueprint = property.id
        ? buildCustomPropertyBlueprint(property.id, getCustomPropertyById)
        : undefined;
      if (!propertyBlueprint) continue;
      properties.push(propertyBlueprint);
    }

    // Build work item type blueprint
    workItemTypesBlueprint.push({
      id: baseWorkItemTypeBlueprint.id,
      name: baseWorkItemTypeBlueprint.name,
      description: baseWorkItemTypeBlueprint.description,
      logo_props: baseWorkItemTypeBlueprint.logo_props,
      is_epic: baseWorkItemTypeBlueprint.is_epic,
      is_default: workItemType.is_default,
      is_active: workItemType.is_active,
      properties,
    });
  }

  return workItemTypesBlueprint;
};

/**
 * Builds the project epics blueprint
 */
const buildProjectEpicBlueprint = (
  epicWorkItemType: IIssueType | undefined
): TProjectTemplate["template_data"]["epics"] => {
  if (!epicWorkItemType || !epicWorkItemType.id || !epicWorkItemType.is_epic) return {};

  const epicWorkItemTypeBlueprint = buildProjectWorkItemTypesBlueprint({ [epicWorkItemType.id]: epicWorkItemType });
  return epicWorkItemTypeBlueprint[0] || {};
};

/**
 * Builds the project states blueprint
 */
const buildProjectStatesBlueprint = (states: IState[]): TProjectTemplate["template_data"]["states"] =>
  states.map((state) => ({
    id: state.id,
    name: state.name,
    description: state.description,
    color: state.color,
    group: state.group,
    default: state.default,
    sequence: state.sequence,
  }));

/**
 * Builds the project labels blueprint
 */
const buildProjectLabelsBlueprint = (labels: IIssueLabel[]): TProjectTemplate["template_data"]["labels"] => {
  // get all label ids
  const labelIds = labels.map((label) => label.id);
  // helper method to get label by id
  const getLabelById = (labelId: string) => labels.find((label) => label.id === labelId) ?? null;
  // build label blueprints
  const labelBlueprints = buildLabelsBlueprint(labelIds, getLabelById);
  return labelBlueprints;
};
