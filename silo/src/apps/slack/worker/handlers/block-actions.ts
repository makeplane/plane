import { fetchPlaneAssets } from "@/apps/slack/helpers/fetch-plane-data";
import { convertToSlackOption, convertToSlackOptions } from "@/apps/slack/helpers/slack-options";
import { createIssueModalViewFull } from "@/apps/slack/views";
import { TBlockActionModalPayload, TBlockActionPayload, TSlackPayload } from "@silo/slack";
import { ACTIONS, ENTITIES, PLANE_PRIORITIES } from "../../helpers/constants";
import { getConnectionDetails } from "../../helpers/connection-details";
import { createCommentModal } from "../../views/create-comment-modal";

export const handleBlockActions = async (data: TBlockActionPayload) => {
  switch (data.actions[0].action_id) {
    case ACTIONS.PROJECT:
      // When a user selects a project from the dropdown in create issue, this is the action that is triggered.
      return await handleProjectSelectAction(data as TBlockActionModalPayload);
    case ACTIONS.LINKBACK_STATE_CHANGE:
      return await handleLinkbackStateChange(data);
    case ACTIONS.ASSIGN_TO_ME:
      return await handleAssignToMeAction(data);
    case ACTIONS.LINKBACK_SWITCH_PRIORITY:
      return await handleSwitchPriorityAction(data);
    case ACTIONS.LINKBACK_SWITCH_CYCLE:
      return await handleSwitchCycleAction(data);
    case ACTIONS.LINKBACK_CREATE_COMMENT:
      return await handleCreateCommentAction(data);
    default:
      return false;
  }
};

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

    await planeClient.cycles.addIssues(workspaceConnection.workspaceSlug, projectId, cycleId, [issueId]);

    await slackService.sendEphemeralMessage(
      data.user.id,
      `Issue cycle successfully updated to ${selection.text.text}. 😄`,
      data.channel.id,
      data.message.thread_ts
    );
  }
}

async function handleCreateCommentAction(data: TBlockActionPayload) {
  if (data.actions[0].type !== "button") return;
  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);
  const value = data.actions[0].value;
  // Show modal for creating a comment
  const values = value.split(".");
  if (values.length === 2) {
    const projectId = values[0];
    const issueId = values[1];
    const issue = await planeClient.issue.getIssue(workspaceConnection.workspaceSlug, projectId, issueId);
    const modal = createCommentModal(issue.name, {
      thread_ts: data.message.thread_ts,
      channel: data.channel.id,
      user: data.user.id,
      value: value,
    });
    try {
      await slackService.openModal(data.trigger_id, modal);
    } catch (error) {
      console.log(error);
    }
  }
}

async function handleSwitchPriorityAction(data: TBlockActionPayload) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

  const value = selection.value.split(".");
  if (value.length === 3) {
    const projectId = value[0];
    const issueId = value[1];

    await planeClient.issue.update(workspaceConnection.workspaceSlug, projectId, issueId, {
      priority: value[2],
    });

    await slackService.sendEphemeralMessage(
      data.user.id,
      `Issue priority successfully updated to ${selection.text.text}. 😄`,
      data.channel.id,
      data.message.thread_ts
    );
  }
}

async function handleProjectSelectAction(data: TBlockActionModalPayload) {
  if (data.actions[0].type !== "static_select") return;

  const selection = data.actions[0].selected_option;
  if (!selection) return;

  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

  const projects = await planeClient.project.list(workspaceConnection.workspaceSlug);
  const selectedProject = await planeClient.project.getProject(workspaceConnection.workspaceSlug, selection.value);
  const projectAssets = await fetchPlaneAssets(workspaceConnection.workspaceSlug, selection.value, planeClient);
  const metadata = JSON.parse(data.view.private_metadata) as TSlackPayload;

  if (metadata && metadata.type === "message_action") {
    const modal = createIssueModalViewFull(
      {
        selectedProject: convertToSlackOption(selectedProject),
        projectOptions: convertToSlackOptions(projects.results),
        priorityOptions: convertToSlackOptions(PLANE_PRIORITIES),
        stateOptions: convertToSlackOptions(projectAssets.states.results),
        assigneeOptions: convertToSlackOptions(projectAssets.members),
        labelOptions: convertToSlackOptions(projectAssets.labels.results),
      },
      metadata.message.text,
      JSON.stringify({ entityType: ENTITIES.ISSUE_SUBMISSION, entityPayload: metadata })
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
    const selection = data.actions[0].selected_option;
    if (!selection) return;

    const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

    const state = selection.value.split(".");
    if (state.length === 3) {
      const projectId = state[0];
      const issueId = state[1];
      const stateId = state[2];

      const stateFull = await planeClient.state.getState(workspaceConnection.workspaceSlug, projectId, stateId);
      await planeClient.issue.update(workspaceConnection.workspaceSlug, projectId, issueId, {
        state: stateId,
      });

      await slackService.sendEphemeralMessage(
        data.user.id,
        `Issue state successfully updated to ${stateFull.name}. 😄`,
        data.channel.id,
        data.message.thread_ts
      );
    }
  }
}

async function handleAssignToMeAction(data: TBlockActionPayload) {
  if (data.actions[0].type !== "button") return;

  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);
  const user = await slackService.getUserInfo(data.user.id);
  const issue = data.actions[0].value.split(".");
  if (issue.length === 2) {
    const projectId = issue[0];
    const issueId = issue[1];

    const planeMembers = await planeClient.users.list(workspaceConnection.workspaceSlug, projectId);
    const member = planeMembers.find((member) => member.email === user?.user.profile.email);

    if (member) {
      await planeClient.issue.update(workspaceConnection.workspaceSlug, projectId, issueId, {
        assignees: [member.id],
      });

      await slackService.sendEphemeralMessage(
        data.user.id,
        "Issue successfully assigned to you. 😄",
        data.channel.id,
        data.message.thread_ts
      );
    }
  }
}
