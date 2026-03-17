/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */
/* oxlint-disable */

import axios from "axios";
import type { TBlockActionModalPayload, TBlockActionPayload } from "@plane/etl/slack";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { convertToSlackOptions } from "@/apps/slack/helpers/slack-options";
import { createProjectSelectionModal } from "@/apps/slack/views";
import { CONSTANTS } from "@/helpers/constants";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ACTIONS, E_ISSUE_OBJECT_TYPE_SELECTION, ENTITIES } from "../../helpers/constants";
import { refreshLinkback } from "../../helpers/linkback";
import { createIntakeModal, createWorkItemModal, patchSlackView } from "../../helpers/modal";
import type {
  SlackPrivateMetadata,
  TSlackConnectionDetails,
  TSlackWorkItemOrIntakeModalParams,
} from "../../types/types";
import { E_MESSAGE_ACTION_TYPES } from "../../types/types";
import { getAccountConnectionBlocks } from "../../views/account-connection";
import { createReplyCommentModal } from "../../views/comments";
import { createWebLinkModal } from "../../views/create-weblink-modal";
import type { PlaneUser } from "@plane/sdk";

const shouldSkipActions = (data: TBlockActionPayload) => {
  const excludedActions = [E_MESSAGE_ACTION_TYPES.CONNECT_ACCOUNT];
  return excludedActions.includes(data?.actions?.[0]?.action_id as E_MESSAGE_ACTION_TYPES);
};

export const handleBlockActions = async (data: TBlockActionPayload) => {
  try {
    if (shouldSkipActions(data)) return;

    // Get connection details once at the top level
    const details = await getConnectionDetails(data.team.id, { id: data.user.id });
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
        data.message?.thread_ts,
        getAccountConnectionBlocks(details)
      );

      return;
    }

    // Pass the details to each handler
    switch (data.actions[0].action_id) {
      case ACTIONS.PROJECT:
        return await handleProjectSelectAction(data as TBlockActionModalPayload, details);
      case ACTIONS.LINKBACK_STATE_CHANGE:
        return await handleLinkbackStateChange(data, details);
      case ACTIONS.LINKBACK_SWITCH_PRIORITY:
        return await handleSwitchPriorityAction(data, details);
      case ACTIONS.ISSUE_OBJECT_TYPE_SELECTION:
        return await handleWorkItemOrIntakeSelectionAction(data as TBlockActionModalPayload, details);
      case ACTIONS.CREATE_WORK_ITEM:
        return await handleCreateWorkItemAction(data, details);
      case ACTIONS.ISSUE_TYPE:
        return await handleIssueTypeSelectAction(data as TBlockActionModalPayload, details);
      case ACTIONS.UPDATE_WORK_ITEM:
        return await handleUpdateWorkItemAction(data, details);
      case ACTIONS.ASSIGN_TO_ME:
        return await handleAssignToMeButtonAction(data, details);
      case ACTIONS.ASSIGN_TO_ME_WO:
        return await handleAssignToMeButtonActionForWO(data, details);
      case ACTIONS.CREATE_REPLY_COMMENT:
        return await handleCreateReplyCommentAction(data, details);
      case ACTIONS.LINKBACK_OVERFLOW_ACTIONS:
        return await handleOverflowActions(data, details);
      case ACTIONS.LINKBACK_CREATE_COMMENT:
        return await handleCreateCommentAction(data, details);
      case ACTIONS.LINKBACK_ADD_WEB_LINK:
        return await handleCreateWebLinkAction(data, details);
      case ACTIONS.DISABLE_SYNC:
        return await handleDisableSyncAction(data, details);
      default:
        return false;
    }
  } catch (error: any) {
    try {
      // Get connection details for error handling
      const details = await getConnectionDetails(data.team.id, { id: data.user.id });
      if (!details) {
        logger.info(`[SLACK] No connection details found for team ${data.team.id}`);
        return;
      }

      const { slackService } = details;

      // We only send data out of the service, so no `response` object is present
      const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);

      const errorMessage = isPermissionError ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE : CONSTANTS.SOMETHING_WENT_WRONG;

      await slackService.sendEphemeralMessage(data.user.id, errorMessage, data.channel.id, data.message?.thread_ts);

      if (!isPermissionError) {
        throw error;
      }
    } catch (innerError) {
      // Log any errors that occur during error handling
      logger.error("[SLACK] Error during error handling:", innerError);
      throw error; // Re-throw the original error
    }
  }
};

/**@deprecated */
async function handleSwitchPriorityAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = details;

  const value = selection.value.split(".");
  if (value.length === 3) {
    const projectId = value[0];
    const issueId = value[1];

    await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
      priority: value[2],
    });
    const refreshedLinkback = await refreshLinkback({
      details,
      issueId,
      projectId,
    });

    if (data.response_url) {
      await axios.post(data.response_url, {
        blocks: refreshedLinkback.blocks,
      });
    }

    await slackService.sendEphemeralMessage(
      data.user.id,
      `Work item *priority* successfully updated to *${selection.text.text}*`,
      data.channel.id,
      data.message?.thread_ts
    );
  }
}

/**@deprecated */
async function handleLinkbackStateChange(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type === "static_select") {
    const selection = data.actions[0].selected_option;
    if (!selection) return;

    const { workspaceConnection, slackService, planeClient } = details;

    const state = selection.value.split(".");
    if (state.length === 3) {
      const projectId = state[0];
      const issueId = state[1];
      const stateId = state[2];

      const stateFull = await planeClient.state.getState(workspaceConnection.workspace_slug, projectId, stateId);

      await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
        state: stateId,
      });

      // Update the linkback
      const refreshedLinkback = await refreshLinkback({
        details,
        issueId,
        projectId,
      });

      if (data.response_url) {
        await axios.post(data.response_url, {
          blocks: refreshedLinkback.blocks,
        });
      }

      await slackService.sendEphemeralMessage(
        data.user.id,
        `Work Item *state* successfully updated to *${stateFull.name}*`,
        data.channel.id,
        data.message?.thread_ts
      );
    }
  }
}

/**
 * @deprecated
 * With the new UI changes, we don't have overflow actions anymore.
 */
async function handleOverflowActions(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "overflow") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  switch (selection.text.text) {
    case "Add Link":
      return await handleCreateWebLinkAction(data, details);
    case "Comment":
      return await handleCreateCommentAction(data, details);
    case "Assign to me":
      return await handleAssignToMeAction(data, details);
    default:
      return false;
  }
}

/**
 * @deprecated
 * With the new UI changes, we don't have overflow actions anymore.
 */
async function handleCreateCommentAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "overflow") return;

  const { slackService } = details;

  const value = data.actions[0].selected_option.value;
  const values = value.split(".");
  if (values.length === 2) {
    const modal = createReplyCommentModal({
      type: data.type,
      user: data.user,
      response_url: data.response_url,
      actions: data.actions,
      message: {
        thread_ts: data.message?.thread_ts || data.container.message_ts,
      },
      value: data.actions[0].selected_option.value,
      channel: data.channel,
      message_ts: data.container.message_ts,
    });
    await slackService.openModal(data.trigger_id, modal);
  }
}

/**
 * @deprecated
 * With the new UI changes, we don't have overflow actions anymore.
 */
async function handleCreateWebLinkAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "overflow") return;

  const { slackService } = details;

  const value = data.actions[0].selected_option.value;
  const values = value.split(".");
  if (values.length === 2) {
    const modal = createWebLinkModal({
      type: data.type,
      user: data.user,
      response_url: data.response_url,
      actions: data.actions,
      message: {
        thread_ts: data.message?.thread_ts || data.container.message_ts,
      },
      value: data.actions[0].selected_option.value,
      channel: data.channel,
      message_ts: data.container.message_ts,
    });
    await slackService.openModal(data.trigger_id, modal);
  }
}

async function handleCreateReplyCommentAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "button") return;

  const value = data.actions[0].value;
  const values = value.split(".");
  if (values.length === 2) {
    const { slackService } = details;

    const replyCommentBlocks = data.message?.blocks || [];

    // Remove the actions from the blocks
    const blocks = replyCommentBlocks
      .map((block) => {
        if (block.type === "actions") {
          return null;
        }
        return block;
      })
      .filter(Boolean);

    const modal = createReplyCommentModal(
      {
        type: data.type,
        user: data.user,
        response_url: data.response_url,
        actions: data.actions,
        message: {
          thread_ts: data.message?.thread_ts || data.container.message_ts,
        },
        value: data.actions[0].value,
        channel: data.channel,
        message_ts: data.container.message_ts,
      },
      blocks
    );

    const response = await slackService.openModal(data.trigger_id, modal);
    logger.info("Response from create comment modal", { response });
  } else {
    logger.error("Invalid values for create comment action", { values });
  }
}

async function handleUpdateWorkItemAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "button") return;

  const value = data.actions[0].value;
  const values = value.split(".");
  const isUnfurl = data.container.is_app_unfurl === true;

  if (values.length !== 2) {
    return;
  }

  const projectId = values[0];
  const issueId = values[1];
  const { workspaceConnection, planeClient } = details;

  const existingIssue = await planeClient.issue.getIssueWithFields(
    workspaceConnection.workspace_slug,
    projectId,
    issueId,
    ["assignees", "labels", "state"]
  );

  const metadata = {
    entityType: ENTITIES.SHORTCUT_PROJECT_SELECTION,
    entityPayload: {
      type: "shortcut_action",
      mode: "update" as const,
      message: {
        text: "Update Work Item",
        ts: data.message?.thread_ts || data.container.message_ts,
      },
      channel: {
        id: data.channel.id,
      },
      preselected_values: {
        project_id: projectId,
        issue_id: issueId,
      },
      response_url: data.response_url,
    },
  };

  const showThreadSync = isUnfurl
    ? false
    : metadata?.entityPayload?.type !== ENTITIES.COMMAND_PROJECT_SELECTION && !!metadata?.entityPayload;

  const params: TSlackWorkItemOrIntakeModalParams = {
    triggerId: data.trigger_id,
    projectId,
    metadata,
    details,
    workItem: existingIssue,
    showThreadSync,
    disableIssueType: true,
  };

  await createWorkItemModal(params);
}

async function handleProjectSelectAction(data: TBlockActionModalPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = details;

  // Parse metadata once
  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata<
    typeof ENTITIES.SHORTCUT_PROJECT_SELECTION
  >;

  // Check if we should handle this entity type
  if (
    metadata.entityType !== ENTITIES.SHORTCUT_PROJECT_SELECTION &&
    metadata.entityType !== ENTITIES.COMMAND_PROJECT_SELECTION
  ) {
    return;
  }

  // Get project to check if intake is enabled
  const selectedProject = await planeClient.project.getProject(workspaceConnection.workspace_slug, selection.value);
  const isIntakeEnabled = selectedProject.intake_view;

  const showThreadSync =
    metadata?.entityPayload?.type !== ENTITIES.COMMAND_PROJECT_SELECTION && !!metadata?.entityPayload;

  if (isIntakeEnabled) {
    // Show project selection modal with intake/work item choice
    const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
    // Get user projects
    const userProjects = convertToSlackOptions(projects.results.filter((project) => project.archived_at == null));
    const modal = createProjectSelectionModal(
      userProjects,
      metadata.entityPayload,
      selection.value,
      metadata.entityType,
      true
    );

    await slackService.updateModal(data.view.id, modal);
  } else {
    // Delegate to work item modal creation
    await createWorkItemModal({
      viewId: data.view.id,
      projectId: selection.value,
      showThreadSync,
      metadata,
      details,
    });
  }
}

async function handleCreateWorkItemAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "button") return;
  const { workspaceConnection, slackService, planeClient } = details;

  const value = data.actions[0].value;
  const projectId = value;
  // Get project to check if intake is enabled
  const selectedProject = await planeClient.project.getProject(workspaceConnection.workspace_slug, projectId);
  const isIntakeEnabled = selectedProject.intake_view;

  if (isIntakeEnabled) {
    // Show project selection modal with intake/work item choice
    const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
    // Get user projects
    const userProjects = convertToSlackOptions(projects.results.filter((project) => project.archived_at == null));
    const modal = createProjectSelectionModal(
      userProjects,
      {
        type: ENTITIES.SHORTCUT_PROJECT_SELECTION,
        mode: "create",
        message: {
          text: "Create Work Item",
          ts: data.message?.thread_ts || data.container.message_ts,
        },
        channel: {
          id: data.channel.id,
        },
      },
      projectId,
      undefined,
      true
    );

    await slackService.openModal(data.trigger_id, modal);
  } else {
    // Delegate to work item modal creation
    await createWorkItemModal({
      triggerId: data.trigger_id,
      projectId,
      details,
    });
  }
}

async function handleWorkItemOrIntakeSelectionAction(data: TBlockActionModalPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const value = selection.value.split(".");
  if (value.length !== 2) return;

  const selectedProjectId = value[0];
  const selectedWorkItemOrIntake = value[1];

  const metadata = JSON.parse(data.view.private_metadata);

  const isWorkItem = selectedWorkItemOrIntake === E_ISSUE_OBJECT_TYPE_SELECTION.WORK_ITEM;
  const showThreadSync = metadata?.entityType !== ENTITIES.COMMAND_PROJECT_SELECTION && !!metadata?.entityPayload;

  // Common parameters for both modal types
  const modalParams: TSlackWorkItemOrIntakeModalParams = {
    viewId: data.view.id,
    projectId: selectedProjectId,
    metadata: metadata,
    details,
    showThreadSync,
  };
  const { slackService } = details;

  let modal: any;

  // Delegate to appropriate modal creation
  if (isWorkItem) {
    modal = await createWorkItemModal(modalParams, false);
  } else {
    modal = await createIntakeModal(modalParams, false);
  }

  const patchedModalWithExistingValues = patchSlackView(modal, data.view.state.values);
  await slackService.updateModal(data.view.id, patchedModalWithExistingValues);
}

async function handleIssueTypeSelectAction(data: TBlockActionModalPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const value = selection.value.split(".");
  if (value.length !== 2) return;

  const selectedProjectId = value[0];
  const selectedIssueTypeId = value[1];

  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata<
    typeof ENTITIES.SHORTCUT_PROJECT_SELECTION
  >;
  const showThreadSync =
    metadata?.entityPayload?.type !== ENTITIES.COMMAND_PROJECT_SELECTION && !!metadata?.entityPayload;
  const { slackService } = details;

  const modalParams: TSlackWorkItemOrIntakeModalParams = {
    viewId: data.view.id,
    projectId: selectedProjectId,
    issueTypeId: selectedIssueTypeId,
    showThreadSync,
    metadata,
    details,
  };

  const modal = await createWorkItemModal(modalParams, false);
  const patchedModalWithExistingValues = patchSlackView(modal, data.view.state.values);
  await slackService.updateModal(data.view.id, patchedModalWithExistingValues);
}

/**
 * @deprecated
 * With the new UI changes, we don't have overflow actions anymore.
 */
async function handleAssignToMeAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "overflow") return;

  const { workspaceConnection, slackService, planeClient } = details;

  const user = await slackService.getUserInfo(data.user.id);
  const issue = data.actions[0].selected_option.value.split(".");
  if (issue.length === 2) {
    const projectId = issue[0];
    const issueId = issue[1];

    const planeMembers = await planeClient.users.list(workspaceConnection.workspace_slug, projectId);
    const member = planeMembers.find((member) => member.email === user?.user.profile.email);

    if (member) {
      await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
        assignees: [member.id],
      });

      await slackService.sendEphemeralMessage(
        data.user.id,
        `Work Item successfully *assigned* to you.`,
        data.channel.id,
        data.message?.thread_ts
      );
    }
  }
}

async function handleAssignToMeButtonAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "button") return;

  const { workspaceConnection, slackService, planeClient } = details;

  const user = await slackService.getUserInfo(data.user.id);
  const identifier = data.actions[0].value.split(".");
  if (identifier.length === 2) {
    const projectId = identifier[0];
    const issueId = identifier[1];

    const [issue, planeMembers] = await Promise.all([
      planeClient.issue.getIssue(workspaceConnection.workspace_slug, projectId, issueId),
      planeClient.users.list(workspaceConnection.workspace_slug, projectId),
    ]);

    const member = planeMembers.find((member) => member.email === user?.user.profile.email);

    if (member) {
      const assigneeIds = issue.assignees.map((assignee) => {
        return typeof assignee === "string" ? assignee : (assignee as PlaneUser).id;
      });

      if (assigneeIds.includes(member.id)) {
        await slackService.sendEphemeralMessage(
          data.user.id,
          `Work Item already *assigned* to you.`,
          data.channel.id,
          data.message?.thread_ts
        );

        return;
      }

      await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
        assignees: [...assigneeIds, member.id],
      });

      await slackService.sendEphemeralMessage(
        data.user.id,
        `Work Item successfully *assigned* to you.`,
        data.channel.id,
        data.message?.thread_ts
      );

      // Update the linkback
      const refreshedLinkback = await refreshLinkback({
        details,
        issueId,
        projectId,
      });

      if (data.response_url) {
        await axios.post(data.response_url, {
          blocks: refreshedLinkback.blocks,
        });
      }
    }
  }
}

async function handleAssignToMeButtonActionForWO(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "button") return;

  const { workspaceConnection, slackService, planeClient } = details;

  const user = await slackService.getUserInfo(data.user.id);
  const identifier = data.actions[0].value.split(".");
  if (identifier.length === 2) {
    const projectId = identifier[0];
    const issueId = identifier[1];

    const [issue, planeMembers] = await Promise.all([
      planeClient.issue.getIssue(workspaceConnection.workspace_slug, projectId, issueId),
      planeClient.users.list(workspaceConnection.workspace_slug, projectId),
    ]);

    const member = planeMembers.find((member) => member.email === user?.user.profile.email);

    if (member) {
      const assigneeIds = issue.assignees.map((assignee) => {
        return typeof assignee === "string" ? assignee : (assignee as PlaneUser).id;
      });

      if (assigneeIds.includes(member.id)) {
        await slackService.sendEphemeralMessage(
          data.user.id,
          `Work Item already *assigned* to you.`,
          data.channel.id,
          data.message?.thread_ts
        );

        return;
      }

      await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
        assignees: [...assigneeIds, member.id],
      });

      await slackService.sendEphemeralMessage(
        data.user.id,
        `Work Item successfully *assigned* to you.`,
        data.channel.id,
        data.message?.thread_ts
      );
    }
  }
}

async function handleDisableSyncAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "button") return;

  const value = data.actions[0].value;
  const values = value.split(".");

  if (values.length !== 2) {
    return;
  }

  const projectId = values[0];
  const issueId = values[1];
  const { workspaceConnection, slackService } = details;
  const apiClient = getAPIClient();

  try {
    // Get existing workspace entity connections for this issue
    const connections = await integrationConnectionHelper.getWorkspaceEntityConnectionsByPlaneProps({
      workspace_id: workspaceConnection.workspace_id,
      issue_id: issueId,
      entity_type: E_INTEGRATION_KEYS.SLACK,
    });

    // Delete all connections for this issue
    if (connections.length > 0) {
      for (const connection of connections) {
        await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(connection.id);
      }

      if (data.message?.thread_ts) {
        // Get user info to include in the message
        const userInfo = await slackService.getUserInfo(data.user.id);
        const userName = userInfo?.user?.real_name || "Unknown User";

        await slackService.sendThreadMessage(
          data.channel.id,
          data.message?.thread_ts,
          `Thread sync has been disabled for this work item by ${userName}.`
        );
      }

      // Update the linkback to remove sync info
      const refreshedLinkback = await refreshLinkback({
        details,
        issueId,
        projectId,
      });

      if (data.response_url) {
        await axios.post(data.response_url, {
          blocks: refreshedLinkback.blocks,
        });
      }
    } else {
      await slackService.sendEphemeralMessage(
        data.user.id,
        "Thread sync is not currently enabled for this work item.",
        data.channel.id,
        data.message?.thread_ts
      );
    }
  } catch {
    await slackService.sendEphemeralMessage(
      data.user.id,
      "Failed to disable thread sync. Please try again.",
      data.channel.id,
      data.message?.thread_ts
    );
  }
}
