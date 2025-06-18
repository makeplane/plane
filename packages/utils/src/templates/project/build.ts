// plane imports
import {
  IIssueLabel,
  IIssueType,
  IState,
  IUserLite,
  TProjectMemberSchema,
  TProjectState,
  TProjectTemplate,
  TProjectTemplateForm,
} from "@plane/types";
// local imports
import { buildCustomPropertySchema, buildLabelsSchema, buildWorkItemTypeSchema } from "../work-item";

export type TBuildProjectTemplateSchemaParams = {
  workspaceId: string;
  getWorkspaceProjectStateById: (projectStateId: string) => TProjectState | undefined;
  getUserDetails: (userId: string) => IUserLite | undefined;
};

type TBuildProjectTemplateDataParams = {
  project: TProjectTemplateForm["project"];
} & TBuildProjectTemplateSchemaParams;

/**
 * Builds the template schema
 */
export const buildProjectTemplateSchema = ({
  workspaceId,
  project,
  getWorkspaceProjectStateById,
  getUserDetails,
}: TBuildProjectTemplateDataParams): TProjectTemplate["template_data"] => ({
  // basics
  name: project.name,
  description: project.description,
  network: project.network,
  default_assignee: {},
  project_lead: buildProjectLeadSchema(project.project_lead, getUserDetails),
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
  workspace: workspaceId,
  // project grouping
  priority: project.priority,
  project_state: buildWorkspaceProjectStateSchema(project.state_id, getWorkspaceProjectStateById),
  start_date: project.start_date,
  target_date: project.target_date,
  // attributes
  members: buildProjectMembersSchema(project.members ?? [], getUserDetails),
  states: buildProjectStatesSchema(project.states),
  labels: buildProjectLabelsSchema(project.labels),
  workflows: [],
  estimates: [],
  workitem_types: buildProjectWorkItemTypesSchema(project.workitem_types),
  epics: buildProjectEpicSchema(project.epics),
});

/**
 * Builds the workspace project state schema
 */
export const buildWorkspaceProjectStateSchema = (
  projectStateId: string | undefined,
  getWorkspaceProjectStateById: TBuildProjectTemplateSchemaParams["getWorkspaceProjectStateById"]
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
 * Builds the member schema
 */
export const buildMemberSchema = (
  memberId: string | undefined,
  getUserDetails: TBuildProjectTemplateSchemaParams["getUserDetails"]
): TProjectMemberSchema | undefined => {
  if (!memberId) return undefined;
  const user = getUserDetails(memberId);
  if (!user) return undefined;
  return { id: user.id };
};

/**
 * Builds the project lead schema
 */
export const buildProjectLeadSchema = (
  projectLeadId: string | IUserLite | null | undefined,
  getUserDetails: TBuildProjectTemplateSchemaParams["getUserDetails"]
): TProjectTemplate["template_data"]["project_lead"] => {
  if (!projectLeadId) return {};
  if (typeof projectLeadId === "string") return buildMemberSchema(projectLeadId, getUserDetails) ?? {};
  return { id: projectLeadId.id };
};

/**
 * Builds members schema
 */
export const buildProjectMembersSchema = (
  memberIds: string[],
  getUserDetails: TBuildProjectTemplateSchemaParams["getUserDetails"]
): TProjectTemplate["template_data"]["members"] =>
  memberIds
    ?.map((memberId) => buildMemberSchema(memberId, getUserDetails))
    .filter((member): member is { id: string } => member !== null);

/**
 * Builds the project work item types schema
 */
export const buildProjectWorkItemTypesSchema = (
  workItemTypes: Record<string, IIssueType>
): TProjectTemplate["template_data"]["workitem_types"] => {
  // helper methods to get work item type and custom property by id
  const getWorkItemTypeById = (workItemTypeId: string) => workItemTypes[workItemTypeId];
  const getCustomPropertyById = (customPropertyId: string) => {
    const allCustomProperties = Object.values(workItemTypes).flatMap((workItemType) => workItemType.properties);
    return allCustomProperties.find((customProperty) => customProperty.id === customPropertyId);
  };

  const workItemTypesSchema: TProjectTemplate["template_data"]["workitem_types"] = [];
  for (const workItemTypeId in workItemTypes) {
    // If work item type details are not available, skip
    const workItemType = getWorkItemTypeById(workItemTypeId);
    if (!workItemType) continue;

    // Build base work item type schema
    const baseWorkItemTypeSchema = buildWorkItemTypeSchema(workItemTypeId, getWorkItemTypeById);
    if (!baseWorkItemTypeSchema) continue;

    // Build properties schema
    const properties: TProjectTemplate["template_data"]["workitem_types"][number]["properties"] = [];
    for (const property of workItemType.properties) {
      const propertySchema = property.id ? buildCustomPropertySchema(property.id, getCustomPropertyById) : undefined;
      if (!propertySchema) continue;
      properties.push(propertySchema);
    }

    // Build work item type schema
    workItemTypesSchema.push({
      id: baseWorkItemTypeSchema.id,
      name: baseWorkItemTypeSchema.name,
      description: baseWorkItemTypeSchema.description,
      logo_props: baseWorkItemTypeSchema.logo_props,
      is_epic: baseWorkItemTypeSchema.is_epic,
      is_default: workItemType.is_default,
      is_active: workItemType.is_active,
      properties,
    });
  }

  return workItemTypesSchema;
};

/**
 * Builds the project epics schema
 */
export const buildProjectEpicSchema = (
  epicWorkItemType: IIssueType | undefined
): TProjectTemplate["template_data"]["epics"] => {
  if (!epicWorkItemType || !epicWorkItemType.id || !epicWorkItemType.is_epic) return {};

  const epicWorkItemTypeSchema = buildProjectWorkItemTypesSchema({ [epicWorkItemType.id]: epicWorkItemType });
  return epicWorkItemTypeSchema[0] || {};
};

/**
 * Builds the project states schema
 */
export const buildProjectStatesSchema = (states: IState[]): TProjectTemplate["template_data"]["states"] =>
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
 * Builds the project labels schema
 */
export const buildProjectLabelsSchema = (labels: IIssueLabel[]): TProjectTemplate["template_data"]["labels"] => {
  // get all label ids
  const labelIds = labels.map((label) => label.id);
  // helper method to get label by id
  const getLabelById = (labelId: string) => labels.find((label) => label.id === labelId) ?? null;
  // build label schemas
  const labelSchemas = buildLabelsSchema(labelIds, getLabelById);
  return labelSchemas;
};
