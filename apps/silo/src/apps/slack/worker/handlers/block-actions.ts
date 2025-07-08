import axios from "axios";
import { TBlockActionModalPayload, TBlockActionPayload } from "@plane/etl/slack";
import { fetchPlaneAssets } from "@/apps/slack/helpers/fetch-plane-data";
import { convertToSlackOption, convertToSlackOptions } from "@/apps/slack/helpers/slack-options";
import { createIssueModalViewFull } from "@/apps/slack/views";
import { CONSTANTS } from "@/helpers/constants";
import { logger } from "@/logger";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ACTIONS, ENTITIES, PLANE_PRIORITIES } from "../../helpers/constants";
import { E_MESSAGE_ACTION_TYPES, SlackPrivateMetadata, TSlackConnectionDetails } from "../../types/types";
import { createCommentModal } from "../../views/create-comment-modal";
import { createWebLinkModal } from "../../views/create-weblink-modal";
import { createSlackLinkback } from "../../views/issue-linkback";
import { getAccountConnectionBlocks } from "../../views/account-connection";

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
      case ACTIONS.LINKBACK_SWITCH_CYCLE:
        return await handleSwitchCycleAction(data, details);
      case ACTIONS.LINKBACK_OVERFLOW_ACTIONS:
        return await handleOverflowActions(data, details);
      case ACTIONS.LINKBACK_CREATE_COMMENT:
        return await handleCreateCommentAction(data, details);
      case ACTIONS.LINKBACK_ADD_WEB_LINK:
        return await handleCreateWebLinkAction(data, details);
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

async function handleSwitchCycleAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = details;

  const value = selection.value.split(".");
  if (value.length === 3) {
    const projectId = value[0];
    const issueId = value[1];
    const cycleId = value[2];

    await planeClient.cycles.addIssues(workspaceConnection.workspace_slug, projectId, cycleId, [issueId]);

    await slackService.sendEphemeralMessage(
      data.user.id,
      `Issue *cycle* successfully updated to *${selection.text.text}*`,
      data.channel.id,
      data.message?.thread_ts
    );
  }
}

async function handleCreateCommentAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "overflow") return;

  const { slackService } = details;

  const value = data.actions[0].selected_option.value;
  const values = value.split(".");
  if (values.length === 2) {
    const modal = createCommentModal({
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

async function handleSwitchPriorityAction(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "static_select") return;

  const isThreadSync =
    data.message && data.message.text && data.message.text.includes("Synced with Plane") ? true : false;

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

    const issue = await planeClient.issue.getIssueWithFields(workspaceConnection.workspace_slug, projectId, issueId, [
      "state",
      "project",
      "assignees",
      "labels",
    ]);
    const states = await planeClient.state.list(workspaceConnection.workspace_slug, projectId);

    const updatedLinkback = createSlackLinkback(
      workspaceConnection.workspace_slug,
      issue,
      states.results,
      isThreadSync
    );

    if (data.response_url) {
      await axios.post(data.response_url, {
        blocks: updatedLinkback.blocks,
      });
    }

    await slackService.sendEphemeralMessage(
      data.user.id,
      `Issue *priority* successfully updated to *${selection.text.text}*`,
      data.channel.id,
      data.message?.thread_ts
    );
  }
}

async function handleProjectSelectAction(data: TBlockActionModalPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = details;

  const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
  const selectedProject = await planeClient.project.getProject(workspaceConnection.workspace_slug, selection.value);
  const projectAssets = await fetchPlaneAssets(workspaceConnection.workspace_slug, selection.value, planeClient);
  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata<
    typeof ENTITIES.SHORTCUT_PROJECT_SELECTION
  >;

  if (
    metadata.entityType === ENTITIES.SHORTCUT_PROJECT_SELECTION ||
    metadata.entityType === ENTITIES.COMMAND_PROJECT_SELECTION
  ) {
    const modal = createIssueModalViewFull(
      {
        selectedProject: convertToSlackOption(selectedProject),
        projectOptions: convertToSlackOptions(projects.results),
        priorityOptions: convertToSlackOptions(PLANE_PRIORITIES),
        stateOptions: convertToSlackOptions(projectAssets.states.results),
      },
      metadata.entityType === ENTITIES.SHORTCUT_PROJECT_SELECTION ? metadata.entityPayload.message?.text : "",
      JSON.stringify({ entityType: metadata.entityType, entityPayload: metadata.entityPayload }),
      metadata.entityPayload.type !== ENTITIES.COMMAND_PROJECT_SELECTION
    );

    await slackService.updateModal(data.view.id, modal);
  }
}

async function handleLinkbackStateChange(data: TBlockActionPayload, details: TSlackConnectionDetails) {
  if (data.actions[0].type === "static_select") {
    const isThreadSync =
      data.message && data.message.text && data.message.text.includes("Synced with Plane") ? true : false;
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

      const issue = await planeClient.issue.getIssueWithFields(workspaceConnection.workspace_slug, projectId, issueId, [
        "state",
        "project",
        "assignees",
        "labels",
      ]);
      const states = await planeClient.state.list(workspaceConnection.workspace_slug, projectId);

      const updatedLinkback = createSlackLinkback(
        workspaceConnection.workspace_slug,
        issue,
        states.results,
        isThreadSync
      );

      if (data.response_url) {
        await axios.post(data.response_url, {
          blocks: updatedLinkback.blocks,
        });
      }

      await slackService.sendEphemeralMessage(
        data.user.id,
        `Issue *state* successfully updated to *${stateFull.name}*`,
        data.channel.id,
        data.message?.thread_ts
      );
    }
  }
}

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
        `Issue successfully *assigned* to you.`,
        data.channel.id,
        data.message?.thread_ts
      );
    }
  }
}
