import axios from "axios";
import { TBlockActionModalPayload, TBlockActionPayload, TSlackPayload } from "@plane/etl/slack";
import { fetchPlaneAssets } from "@/apps/slack/helpers/fetch-plane-data";
import { convertToSlackOption, convertToSlackOptions } from "@/apps/slack/helpers/slack-options";
import { createIssueModalViewFull } from "@/apps/slack/views";
import { logger } from "@/logger";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ACTIONS, ENTITIES, PLANE_PRIORITIES } from "../../helpers/constants";
import { SlackPrivateMetadata } from "../../types/types";
import { createCommentModal } from "../../views/create-comment-modal";
import { createWebLinkModal } from "../../views/create-weblink-modal";
import { createSlackLinkback } from "../../views/issue-linkback";

export const handleBlockActions = async (data: TBlockActionPayload) => {
  switch (data.actions[0].action_id) {
    case ACTIONS.PROJECT:
      return await handleProjectSelectAction(data as TBlockActionModalPayload);
    case ACTIONS.LINKBACK_STATE_CHANGE:
      return await handleLinkbackStateChange(data);
    case ACTIONS.LINKBACK_SWITCH_PRIORITY:
      return await handleSwitchPriorityAction(data);
    case ACTIONS.LINKBACK_SWITCH_CYCLE:
      return await handleSwitchCycleAction(data);
    case ACTIONS.LINKBACK_OVERFLOW_ACTIONS:
      return await handleOverflowActions(data);
    case ACTIONS.LINKBACK_CREATE_COMMENT:
      return await handleCreateCommentAction(data);
    case ACTIONS.LINKBACK_ADD_WEB_LINK:
      return await handleCreateWebLinkAction(data);
    default:
      return false;
  }
};

async function handleOverflowActions(data: TBlockActionPayload) {
  if (data.actions[0].type !== "overflow") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  switch (selection.text.text) {
    case "Add Link":
      return await handleCreateWebLinkAction(data);
    case "Comment":
      return await handleCreateCommentAction(data);
    case "Assign to me":
      return await handleAssignToMeAction(data);
    default:
      return false;
  }
}

async function handleSwitchCycleAction(data: TBlockActionPayload) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

  const value = selection.value.split(".");
  if (value.length === 3) {
    const projectId = value[0];
    const issueId = value[1];
    const cycleId = value[2];

    try {
      await planeClient.cycles.addIssues(workspaceConnection.workspace_slug, projectId, cycleId, [issueId]);

      await slackService.sendEphemeralMessage(
        data.user.id,
        `Issue cycle successfully updated to ${selection.text.text}. 😄`,
        data.channel.id,
        data.message?.thread_ts
      );
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || "Something went wrong. Please try again.";
      await slackService.sendEphemeralMessage(data.user.id, errorMessage, data.channel.id, data.message?.thread_ts);
    }
  }
}

async function handleCreateCommentAction(data: TBlockActionPayload) {
  if (data.actions[0].type !== "overflow") return;
  const { slackService } = await getConnectionDetails(data.team.id);
  const value = data.actions[0].selected_option.value;
  // Show modal for creating a comment
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
    try {
      await slackService.openModal(data.trigger_id, modal);
    } catch (error) {
      console.log(error);
      await slackService.sendEphemeralMessage(
        data.user.id,
        "Something went wrong. Please try again.",
        data.channel.id,
        data.message?.thread_ts
      );
    }
  }
}

async function handleCreateWebLinkAction(data: TBlockActionPayload) {
  if (data.actions[0].type !== "overflow") return;
  const { slackService } = await getConnectionDetails(data.team.id);
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
    try {
      await slackService.openModal(data.trigger_id, modal);
    } catch (error) {
      console.log(error);
      await slackService.sendEphemeralMessage(
        data.user.id,
        "Something went wrong. Please try again.",
        data.channel.id,
        data.message?.thread_ts
      );
    }
  }
}

async function handleSwitchPriorityAction(data: TBlockActionPayload) {
  if (data.actions[0].type !== "static_select") return;

  const isThreadSync =
    data.message && data.message.text && data.message.text.includes("Synced with Plane") ? true : false;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

  const value = selection.value.split(".");
  if (value.length === 3) {
    const projectId = value[0];
    const issueId = value[1];

    try {
      await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
        priority: value[2],
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || "Something went wrong. Please try again.";
      await slackService.sendEphemeralMessage(data.user.id, errorMessage, data.channel.id, data.message?.thread_ts);
    }

    const issue = await planeClient.issue.getIssue(workspaceConnection.workspace_slug, projectId, issueId);
    const project = await planeClient.project.getProject(workspaceConnection.workspace_slug, projectId);
    const states = await planeClient.state.list(workspaceConnection.workspace_slug, projectId);
    const members = await planeClient.users.list(workspaceConnection.workspace_slug, projectId);

    // Create updated linkback
    const updatedLinkback = createSlackLinkback(
      workspaceConnection.workspace_slug,
      project,
      members,
      states.results,
      issue,
      isThreadSync
    );

    // Update the unfurl using response_url with proper Slack message format
    if (data.response_url) {
      try {
        await axios.post(data.response_url, {
          blocks: updatedLinkback.blocks,
        });
      } catch (error) {
        logger.error("Could not update unfurl", error);
        console.error(error);
      }
    }

    if (data.message?.thread_ts) {
      await slackService.sendEphemeralMessage(
        data.user.id,
        `Issue state successfully updated to ${selection.text.text}.`,
        data.channel.id,
        data.message?.thread_ts
      );
    } else {
      await slackService.sendThreadMessage(
        data.channel.id,
        data.container.message_ts,
        `Issue state successfully updated to ${selection.text.text}.`
      );
    }
  }
}

async function handleProjectSelectAction(data: TBlockActionModalPayload) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

  const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
  const selectedProject = await planeClient.project.getProject(workspaceConnection.workspace_slug, selection.value);
  const projectAssets = await fetchPlaneAssets(workspaceConnection.workspace_slug, selection.value, planeClient);
  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata;

  if (
    (metadata && metadata.entityPayload.type === "message_action") ||
    metadata.entityPayload.type === "shortcut" ||
    metadata.entityPayload.type === "command"
  ) {
    const modal = createIssueModalViewFull(
      {
        selectedProject: convertToSlackOption(selectedProject),
        projectOptions: convertToSlackOptions(projects.results),
        priorityOptions: convertToSlackOptions(PLANE_PRIORITIES),
        stateOptions: convertToSlackOptions(projectAssets.states.results),
      },
      // If the payload type is a message_action then only take the text from the message
      metadata.entityType === ENTITIES.SHORTCUT_PROJECT_SELECTION && metadata.entityPayload.type === "message_action"
        ? metadata.entityPayload.message?.text
        : "",
      JSON.stringify({ entityType: ENTITIES.ISSUE_SUBMISSION, entityPayload: metadata.entityPayload }),
      metadata.entityPayload.type === "command" ? false : true
    );

    try {
      await slackService.updateModal(data.view.id, modal);
    } catch (error) {
      console.log(error);
    }
  }
}

async function handleLinkbackStateChange(data: TBlockActionPayload) {
  if (data.actions[0].type === "static_select") {
    const isThreadSync =
      data.message && data.message.text && data.message.text.includes("Synced with Plane") ? true : false;
    const selection = data.actions[0].selected_option;
    if (!selection) return;

    const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

    const state = selection.value.split(".");
    if (state.length === 3) {
      const projectId = state[0];
      const issueId = state[1];
      const stateId = state[2];

      const stateFull = await planeClient.state.getState(workspaceConnection.workspace_slug, projectId, stateId);

      try {
        await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
          state: stateId,
        });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || "Something went wrong. Please try again.";
        await slackService.sendEphemeralMessage(data.user.id, errorMessage, data.channel.id, data.message?.thread_ts);
      }

      // Get updated issue data
      const issue = await planeClient.issue.getIssue(workspaceConnection.workspace_slug, projectId, issueId);
      const project = await planeClient.project.getProject(workspaceConnection.workspace_slug, projectId);
      const states = await planeClient.state.list(workspaceConnection.workspace_slug, projectId);
      const members = await planeClient.users.list(workspaceConnection.workspace_slug, projectId);

      // Create updated linkback
      const updatedLinkback = createSlackLinkback(
        workspaceConnection.workspace_slug,
        project,
        members,
        states.results,
        issue,
        isThreadSync
      );

      // Update the unfurl using response_url with proper Slack message format
      if (data.response_url) {
        try {
          await axios.post(data.response_url, {
            blocks: updatedLinkback.blocks,
          });
        } catch (error) {
          logger.error("Could not update unfurl", error);
          console.error(error);
        }
      }

      if (data.message?.thread_ts) {
        await slackService.sendEphemeralMessage(
          data.user.id,
          `Issue state successfully updated to ${stateFull.name}. 😄`,
          data.channel.id,
          data.message?.thread_ts
        );
      } else {
        await slackService.sendThreadMessage(
          data.channel.id,
          data.container.message_ts,
          `Issue state successfully updated to ${stateFull.name}. 😄`
        );
      }
    }
  }
}

async function handleAssignToMeAction(data: TBlockActionPayload) {
  if (data.actions[0].type !== "overflow") return;

  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);
  const user = await slackService.getUserInfo(data.user.id);
  const issue = data.actions[0].selected_option.value.split(".");
  if (issue.length === 2) {
    const projectId = issue[0];
    const issueId = issue[1];

    const planeMembers = await planeClient.users.list(workspaceConnection.workspace_slug, projectId);
    const member = planeMembers.find((member) => member.email === user?.user.profile.email);

    if (member) {
      try {
        await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
          assignees: [member.id],
        });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || "Something went wrong. Please try again.";
        await slackService.sendEphemeralMessage(data.user.id, errorMessage, data.channel.id, data.message?.thread_ts);
      }

      if (data.message?.thread_ts) {
        await slackService.sendEphemeralMessage(
          data.user.id,
          `Issue successfully assigned to you.`,
          data.channel.id,
          data.message?.thread_ts
        );
      } else {
        await slackService.sendThreadMessage(
          data.channel.id,
          data.container.message_ts,
          `Issue successfully assigned to you.`
        );
      }
    }
  }
}
