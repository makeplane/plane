import { ExIssue, IssueWithExpanded } from "@plane/sdk";
import { E_INTEGRATION_KEYS, TWorkspaceConnection } from "@plane/types";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { logger } from "@/logger";
import { getCreateIntakeFormFields, getCreateWorkItemFormFields } from "@/services/form-fields";
import { E_KNOWN_FIELD_KEY, FormField } from "@/types/form/base";
import { SlackBlockValue } from "../types/fields";
import { SlackPrivateMetadata, TSlackWorkItemOrIntakeModalParams } from "../types/types";
import { createIssueModalViewFull } from "../views";
import { ENTITIES } from "./constants";
import { extractFieldValue, getSlackBlock } from "./fields";
import { convertToSlackOption, convertToSlackOptions, PlainTextOption } from "./slack-options";

export function patchSlackView(newModal: any, existingValues: any) {
  // If no existing values, return the modal as-is
  if (!existingValues || !newModal.blocks) {
    return newModal;
  }

  // Create a flat map of action_id -> value object
  const actionValueMap = new Map();
  Object.values(existingValues).forEach((blockData: any) => {
    Object.entries(blockData).forEach(([actionId, valueObject]) => {
      actionValueMap.set(actionId, valueObject);
    });
  });

  // Process each block and merge existing values if available
  const patchedBlocks = newModal.blocks.map((block: any) => {
    if (block.type !== "input" || !block.element?.action_id) {
      logger.info("No input block or action_id", { block });
      return block;
    }

    const existingValue = actionValueMap.get(block.element.action_id);
    if (!existingValue) {
      logger.info("No existing value for this action_id", { actionId: block.element.action_id });
      return block; // No existing value for this action_id
    }

    // Clone the block and convert state values to initial values
    const patchedBlock = {
      ...block,
      element: {
        ...block.element,
        // Convert state properties to initial properties
        ...(existingValue.selected_option && { initial_option: existingValue.selected_option }),
        ...(existingValue.selected_options &&
          existingValue.selected_options.length > 0 && { initial_options: existingValue.selected_options }),
        ...(existingValue.value && { initial_value: existingValue.value }),
        ...(existingValue.rich_text_value && { initial_value: existingValue.rich_text_value }),
        ...(existingValue.selected_date && { initial_date: existingValue.selected_date }),
      },
    };

    return patchedBlock;
  });

  return {
    ...newModal,
    blocks: patchedBlocks,
  };
}

// ================================ API ================================

/**
 * Creates a work item modal for Slack integration
 * @param params - Parameters for creating the work item modal
 * @returns Promise<void>
 */
export async function createWorkItemModal(params: TSlackWorkItemOrIntakeModalParams, shouldDispatch: boolean = true) {
  const { viewId, triggerId, details, workItem, issueTypeId, metadata, showThreadSync } = params;
  const { slackService, planeClient, workspaceConnection, credentials } = details;

  // Get common prepared data
  const { selectedProject, modalData, privateMetadata } = await prepareModalData(params);

  const issueTypeEnabled = selectedProject.is_issue_type_enabled ?? false;
  const issueTypeOptions = [];

  if (!selectedProject.id) {
    throw new Error("Selected project id is required");
  }

  let selectedIssueTypeBlock: PlainTextOption | undefined;
  let selectedIssueType: string | undefined;

  if (issueTypeEnabled && !params.disableIssueType) {
    const issueTypes = await planeClient.issueType.fetch(workspaceConnection.workspace_slug, selectedProject.id);
    issueTypeOptions.push(...convertToSlackOptions(issueTypes, selectedProject.id));

    // If issue type is enabled, we need to find the matching issue type,
    // as in plane there is a concept of default issue type, which is not the one we want to use.
    const matchingIssueType = issueTypes.find((issueType) =>
      issueTypeId ? issueType.id === issueTypeId : issueType.is_default
    );
    if (matchingIssueType) {
      selectedIssueTypeBlock = convertToSlackOption(matchingIssueType, selectedProject.id);
      selectedIssueType = matchingIssueType.id;
    }
  }

  if (!credentials.target_access_token) {
    throw new Error("Target access token is required");
  }

  const slackBlocks = await getSlackBlocks(
    {
      workspaceConnection,
      workspaceSlug: workspaceConnection.workspace_slug,
      projectId: selectedProject.id,
      issueTypeId: selectedIssueType,
      accessToken: credentials.target_access_token,
    },
    "work-item",
    metadata,
    workItem
  );

  let threadSyncEnabled = false;

  if (showThreadSync && workItem) {
    // If we are showing thread sync and there is a work item associated, which means that the work item is being updated,
    // we need to check if the work item has a thread sync associated with it.
    const connections = await integrationConnectionHelper.getWorkspaceEntityConnectionsByPlaneProps({
      workspace_id: workspaceConnection.workspace_id,
      issue_id: workItem.id,
      entity_type: E_INTEGRATION_KEYS.SLACK,
    });

    threadSyncEnabled = connections.length > 0;
  }

  // Create work item modal
  const modal = createIssueModalViewFull({
    options: modalData,
    privateMetadata,
    config: {
      showIntakeDropdown: selectedProject.intake_view ?? false,
      threadSync: {
        showThreadSync: showThreadSync ?? false,
        threadSyncEnabled,
      },
      issueType: {
        showIssueTypeDropdown: issueTypeEnabled && !params.disableIssueType,
        issueTypeOptions,
        selectedIssueType: selectedIssueTypeBlock,
      },
    },
    isWorkItem: true,
    slackBlocks,
    isUpdate: !!workItem,
  });

  if (shouldDispatch) {
    if (viewId) {
      const res = await slackService.updateModal(viewId, modal);
      logger.info("Modal updated", { res });
    } else {
      if (!triggerId) {
        throw new Error("Trigger id is required");
      }
      const res = await slackService.openModal(triggerId, modal);
      logger.info("Modal opened", { res });
    }
  }

  return modal;
}

/**
 * Creates an intake modal for Slack integration
 * @param params - Parameters for creating the intake modal
 * @returns Promise<void>
 */
export async function createIntakeModal(params: TSlackWorkItemOrIntakeModalParams, shouldDispatch: boolean = true) {
  const { viewId, details, metadata, triggerId, showThreadSync } = params;
  const { slackService } = details;
  const { workspaceConnection, credentials } = details;

  // Get common prepared data
  const { selectedProject, modalData, privateMetadata } = await prepareModalData(params);

  if (!selectedProject.id) {
    throw new Error("Selected project id is required");
  }

  if (!credentials.target_access_token) {
    throw new Error("Target access token is required");
  }

  const slackBlocks = await getSlackBlocks(
    {
      workspaceConnection,
      workspaceSlug: workspaceConnection.workspace_slug,
      projectId: selectedProject.id,
      accessToken: credentials.target_access_token,
    },
    "intake",
    metadata
  );

  // Create intake modal
  const modal = createIssueModalViewFull({
    options: modalData,
    privateMetadata,
    config: {
      showIntakeDropdown: true,
      threadSync: {
        showThreadSync: showThreadSync ?? false,
        threadSyncEnabled: false,
      },
    },
    isWorkItem: false,
    slackBlocks,
  });

  if (shouldDispatch) {
    if (viewId) {
      const res = await slackService.updateModal(viewId, modal);
      logger.info("Modal updated", { res });
    } else {
      if (!triggerId) {
        throw new Error("Trigger id is required");
      }
      const res = await slackService.openModal(triggerId, modal);
      logger.info("Modal opened", { res });
    }
  }

  return modal;
}

// ================================ HELPERS ================================

/**
 * Prepares modal data by fetching projects and creating modal configuration
 * @param params - Parameters containing project and metadata information
 * @returns Promise containing modal data, selected project, and private metadata
 */
async function prepareModalData(params: TSlackWorkItemOrIntakeModalParams) {
  const { projectId, metadata, details } = params;
  const { workspaceConnection, planeClient, credentials } = details;

  // Fetch all required data
  const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
  const selectedProject = await planeClient.project.getProject(workspaceConnection.workspace_slug, projectId);

  if (!selectedProject.id) {
    throw new Error("Selected project id is required");
  }

  if (!credentials.target_access_token) {
    throw new Error("Target access token is required");
  }

  // Prepare modal data
  const modalData = {
    selectedProject: convertToSlackOption(selectedProject),
    projectOptions: convertToSlackOptions(projects.results),
  };

  const privateMetadata = JSON.stringify({ entityType: metadata?.entityType, entityPayload: metadata?.entityPayload });

  return {
    modalData,
    selectedProject,
    privateMetadata,
  };
}

/**
 * Maps a single form field to a Slack block based on field type and current values
 * @param field - The form field to map
 * @param projectId - The project ID
 * @param metadata - Optional metadata containing entity payload
 * @param workItem - Optional work item containing current values
 * @returns Promise containing the mapped Slack block or undefined
 */
async function mapFieldToSlackBlock(
  field: FormField,
  projectId: string,
  metadata?: SlackPrivateMetadata<typeof ENTITIES.SHORTCUT_PROJECT_SELECTION>,
  workItem?: Partial<IssueWithExpanded<["state", "project", "assignees", "labels", "created_by", "updated_by"]>>
) {
  if (field.id === E_KNOWN_FIELD_KEY.DESCRIPTION_HTML && metadata) {
    if (workItem) {
      return undefined;
    } else {
      return getSlackBlock(projectId, field, metadata.entityPayload?.message?.blocks);
    }
  }

  if (field.id === E_KNOWN_FIELD_KEY.TITLE) field.id = E_KNOWN_FIELD_KEY.NAME;

  if (field.id === E_KNOWN_FIELD_KEY.PRIORITY && workItem?.priority) {
    return getSlackBlock(
      projectId,
      field,
      convertToSlackOption({
        id: workItem?.priority,
        name: workItem?.priority.charAt(0).toUpperCase() + workItem?.priority.slice(1),
      })
    );
  }

  const currentValue = extractFieldValue(workItem?.[field.id as keyof ExIssue]);
  return getSlackBlock(projectId, field, currentValue as SlackBlockValue);
}

/**
 * Generates Slack blocks for form fields based on the type (work-item or intake)
 * @param params - Parameters containing workspace and project information
 * @param type - The type of form (work-item or intake)
 * @param metadata - Optional metadata for the form
 * @param workItem - Optional work item for pre-populating values
 * @returns Promise containing an array of Slack blocks
 */
async function getSlackBlocks(
  params: {
    workspaceSlug: string;
    projectId: string;
    issueTypeId?: string;
    accessToken: string;
    workspaceConnection: TWorkspaceConnection;
  },
  type: "work-item" | "intake",
  metadata?: SlackPrivateMetadata<typeof ENTITIES.SHORTCUT_PROJECT_SELECTION>,
  workItem?: Partial<IssueWithExpanded<["state", "project", "assignees", "labels", "created_by", "updated_by"]>>
) {
  const { workspaceSlug, projectId, issueTypeId, accessToken } = params;

  // Get the fields for the selected project and issue type
  const fields =
    type === "work-item"
      ? await getCreateWorkItemFormFields(workspaceSlug, projectId, accessToken, issueTypeId)
      : await getCreateIntakeFormFields(workspaceSlug, projectId);

  const blocks = fields.fields
    .filter((field) => (field.customField ? field.required && field.visible : true))
    .map(async (field) => mapFieldToSlackBlock(field, projectId, metadata, workItem));

  return (await Promise.all(blocks)).filter(Boolean);
}
