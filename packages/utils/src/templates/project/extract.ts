import { v4 as uuidv4 } from "uuid";
// plane imports
import {
  CompleteOrEmpty,
  IIssueLabel,
  IIssueType,
  IState,
  TProjectTemplate,
  TProjectTemplateFormData,
  TProjectWorkItemTypeBlueprint,
} from "@plane/types";
// local imports
import { extractIds, isComplete } from "../../common";
import { extractWorkItemFormDataBlueprint } from "../work-item";
import { mockCreateOrUpdateLabel } from "./label";
import { mockCreateOrUpdateState } from "./state";
import {
  mockCreateCustomProperty,
  mockCreateWorkItemTypeInstance,
  TMockCreateWorkItemTypeInstanceParams,
} from "./work-item-type";

type TExtractProjectCreationFormDataParams = {
  projectData: TProjectTemplate["template_data"];
};

/**
 * Extracts project creation form data that are required for the project creation form
 */
export const extractProjectCreationFormData = (params: TExtractProjectCreationFormDataParams) => {
  const { projectData } = params;

  return {
    id: uuidv4(),
    name: projectData.name,
    description: projectData.description,
    logo_props: projectData.logo_props,
    cover_image_url: projectData.cover_asset,
    network: projectData.network,
    project_lead: projectData.project_lead?.id ?? null,
    // attributes
    members: extractIds(projectData.members ?? []),
    // project grouping
    priority: projectData.priority,
    state_id: projectData.project_state?.id,
    start_date: projectData.start_date,
    target_date: projectData.target_date,
  };
};

type TExtractProjectTemplateFormDataParams = Omit<TMockCreateWorkItemTypeInstanceParams, "data"> &
  TExtractProjectCreationFormDataParams;

/**
 * Extracts project form data from the template
 */
export const extractProjectTemplateFormData = async (
  params: TExtractProjectTemplateFormDataParams
): Promise<TProjectTemplateFormData> => {
  const { projectData } = params;
  // Extract base project data
  const baseProjectData = extractProjectCreationFormData({ projectData });

  return {
    ...baseProjectData,
    // additional attributes
    workitem_types: await extractProjectWorkItemTypeFormData({
      ...params,
      workItemTypes: projectData.workitem_types,
    }),
    epics: await extractProjectEpicFormData({
      ...params,
      epics: projectData.epics,
    }),
    labels: await extractProjectLabelFormData({
      ...params,
      labels: projectData.labels,
    }),
    states: await extractProjectStateFormData({
      ...params,
      states: projectData.states,
    }),
    // feature toggles
    cycle_view: projectData.cycle_view,
    module_view: projectData.module_view,
    issue_views_view: projectData.issue_views_view,
    page_view: projectData.page_view,
    intake_view: projectData.intake_view,
    intake_settings: projectData.intake_settings,
    is_time_tracking_enabled: projectData.is_time_tracking_enabled,
    is_issue_type_enabled: projectData.is_issue_type_enabled,
    is_project_updates_enabled: projectData.is_project_updates_enabled,
    is_epic_enabled: projectData.is_epic_enabled,
    is_workflow_enabled: projectData.is_workflow_enabled,
    workitems: projectData.workitems.map((workItem) =>
      extractWorkItemFormDataBlueprint({ ...workItem, project: baseProjectData.id })
    ),
  };
};

type TProcessWorkItemTypeParams = Omit<TMockCreateWorkItemTypeInstanceParams, "data"> & {
  workItemType: CompleteOrEmpty<TProjectWorkItemTypeBlueprint>;
};

/**
 * Processes a single work item type and its properties to create a work item type instance
 */
const processWorkItemType = async (
  params: TProcessWorkItemTypeParams
): Promise<{ id: string; instance: IIssueType } | null> => {
  const { workItemType } = params;

  // Check if the work item type is complete
  if (!workItemType.id || !isComplete(workItemType)) return null;

  // Extract the properties and the work item type data
  const { properties, ...workItemTypeData } = workItemType;

  // Create the work item type instance
  const workItemTypeInstance = await mockCreateWorkItemTypeInstance({
    ...params,
    data: workItemTypeData,
  });

  // Process the properties and add them to the work item type instance
  for (const property of properties) {
    const propertyWithOptions = await mockCreateCustomProperty({
      ...params,
      data: property,
    });
    const { options, ...propertyData } = propertyWithOptions;
    workItemTypeInstance.addOrUpdateProperty(propertyData, options);
  }

  // Return the work item type instance
  return { id: workItemType.id, instance: workItemTypeInstance };
};

type TExtractProjectWorkItemTypeFormDataParams = Omit<TMockCreateWorkItemTypeInstanceParams, "data"> & {
  workItemTypes: TProjectTemplate["template_data"]["workitem_types"];
};

/**
 * Extracts project work item type form data
 */
const extractProjectWorkItemTypeFormData = async (
  params: TExtractProjectWorkItemTypeFormDataParams
): Promise<Record<string, IIssueType>> => {
  const { workItemTypes } = params;

  const workItemTypesFormData: Record<string, IIssueType> = {};
  for (const workItemType of workItemTypes) {
    const result = await processWorkItemType({
      ...params,
      workItemType,
    });
    if (result) {
      const { id, instance } = result;
      workItemTypesFormData[id] = instance;
    }
  }

  return workItemTypesFormData;
};

type TExtractProjectEpicFormDataParams = Omit<TMockCreateWorkItemTypeInstanceParams, "data"> & {
  epics: TProjectTemplate["template_data"]["epics"];
};

/**
 * Extracts project epic form data
 */
const extractProjectEpicFormData = async (
  params: TExtractProjectEpicFormDataParams
): Promise<IIssueType | undefined> => {
  const { epics } = params;

  const result = await processWorkItemType({
    ...params,
    workItemType: epics,
  });

  if (!result) return undefined;

  return result.instance;
};

type TExtractProjectLabelFormDataParams = {
  workspaceSlug: string;
  projectId: string;
  labels: TProjectTemplate["template_data"]["labels"];
};

/**
 * Extracts project label form data
 */
const extractProjectLabelFormData = async (params: TExtractProjectLabelFormDataParams): Promise<IIssueLabel[]> => {
  const labelFormData: IIssueLabel[] = [];

  for (const label of params.labels) {
    const result = await mockCreateOrUpdateLabel(params.workspaceSlug, params.projectId, label);
    labelFormData.push(result);
  }

  return labelFormData;
};

type TExtractProjectStateFormDataParams = {
  workspaceSlug: string;
  projectId: string;
  states: TProjectTemplate["template_data"]["states"];
};

/**
 * Extracts project state form data
 */
const extractProjectStateFormData = async (params: TExtractProjectStateFormDataParams): Promise<IState[]> => {
  const { states } = params;

  const stateFormData: IState[] = [];

  for (const state of states) {
    const result = await mockCreateOrUpdateState({
      ...params,
      data: state,
    });
    stateFormData.push(result);
  }

  return stateFormData;
};
