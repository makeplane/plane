import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { TMessageActionPayload } from "@plane/etl/slack";
import { convertToSlackOptions } from "@/apps/slack/helpers/slack-options";
import { createProjectSelectionModal } from "@/apps/slack/views";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ENTITIES } from "../../helpers/constants";
import { getUserMapFromSlackWorkspaceConnection } from "../../helpers/user";
import { E_MESSAGE_ACTION_TYPES } from "../../types/types";
import { getAccountConnectionBlocks } from "../../views/account-connection";
import { alreadyLinkedModalView, createLinkIssueModalView } from "../../views/link-issue-modal";

const apiClient = getAPIClient();

export const handleMessageAction = async (data: TMessageActionPayload) => {
  if (!data.callback_id) {
    logger.info(`[SLACK] No callback id found for message action ${data.type}`);
    return;
  }

  switch (data.callback_id) {
    case E_MESSAGE_ACTION_TYPES.LINK_WORK_ITEM:
      await handleLinkWorkItem(data);
      break;
    case E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM:
    case E_MESSAGE_ACTION_TYPES.CREATE_INTAKE_ISSUE:
      await handleCreateNewWorkItem(data, data.callback_id === E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM);
      break;
  }
};

const handleLinkWorkItem = async (data: TMessageActionPayload) => {
  // Get the workspace connection for the associated team

  /*
   * A work item can only be linked to one thread at a time
   1. If connected to existing work item, show the work item details in the modal and disconnect button
   2. If no work item is connected, show the modal to link a work item
   3. If selected work item is already linked to another thread, show a message to the user that it is
      already linked to another thread and to disconnect it first
  */

  const details = await getConnectionDetails(data.team.id, {
    id: data.user.id,
  });
  if (!details) {
    logger.info(`[SLACK] No connection details found for team ${data.team.id}`);
    return;
  }

  if (details.missingUserCredentials) {
    const { slackService } = details;

    await slackService.sendEphemeralMessage(
      data.user.id,
      "Please connect your Slack account to Plane to use this feature.",
      data.channel.id,
      undefined,
      getAccountConnectionBlocks(details)
    );

    return;
  }

  const { slackService, planeClient, workspaceConnection } = details;

  const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);

  const metadata = {
    type: "message_action",
    channel: {
      id: data.channel.id,
      name: data.channel.name,
    },
    message: {
      text: data.message.text,
      ts: data.message.ts,
    },
  };

  const workspaceEntityConnections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_connection_id: details.workspaceConnection.id,
    entity_type: E_INTEGRATION_KEYS.SLACK,
    entity_id: data.message.ts,
  });

  let modal: any | undefined;

  if (workspaceEntityConnections.length > 0) {
    const issuePromise = planeClient.issue.getIssueWithFields(
      workspaceEntityConnections[0].workspace_slug,
      workspaceEntityConnections[0].project_id!,
      workspaceEntityConnections[0].issue_id!,
      ["state", "project", "assignees", "labels", "created_by", "updated_by"]
    );
    const statesPromise = planeClient.state.list(
      workspaceEntityConnections[0].workspace_slug,
      workspaceEntityConnections[0].project_id!
    );

    const [issue, states] = await Promise.all([issuePromise, statesPromise]);

    modal = alreadyLinkedModalView(
      workspaceEntityConnections[0].workspace_slug,
      issue,
      states.results,
      userMap,
      metadata
    );
  } else {
    modal = createLinkIssueModalView(metadata);
  }

  try {
    const res = await slackService.openModal(data.trigger_id, modal);
    if (res && !res.ok) {
      logger.error("Something went wrong while opening the modal", res);
    }
  } catch (error) {
    logger.error(error);
  }
};

const handleCreateNewWorkItem = async (data: TMessageActionPayload, isWorkItem: boolean = true) => {
  // Get the workspace connection for the associated team
  const details = await getConnectionDetails(data.team.id, {
    id: data.user.id,
  });

  if (!details) {
    logger.info(`[SLACK] No connection details found for team ${data.team.id}`);
    return;
  }

  if (details.missingUserCredentials) {
    const { slackService } = details;

    await slackService.sendEphemeralMessage(
      data.user.id,
      "Please connect your Slack account to Plane to use this feature.",
      data.channel.id,
      undefined,
      getAccountConnectionBlocks(details)
    );

    return;
  }

  const { workspaceConnection, slackService, planeClient } = details;

  const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
  const filteredProjects = projects.results.filter((project) => project.is_member === true);
  const plainTextOptions = convertToSlackOptions(filteredProjects);
  const modal = createProjectSelectionModal(
    plainTextOptions,
    {
      type: ENTITIES.SHORTCUT_PROJECT_SELECTION,
      mode: "create",
      message: {
        text: data.message.text,
        ts: data.message.ts,
        blocks: data.message.blocks,
      },
      channel: {
        id: data.channel.id,
      },
    },
    undefined,
    undefined,
    false
  );

  try {
    const res = await slackService.openModal(data.trigger_id, modal);
    if (res && !res.ok) {
      logger.error("Something went wrong while opening the modal", res);
    }
  } catch (error) {
    logger.error(error);
  }
};
