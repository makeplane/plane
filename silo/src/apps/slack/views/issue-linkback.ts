import { env } from "@/env";
import { ExIssue, ExProject, ExState, PlaneUser } from "@plane/sdk";
import { formatTimestampToNaturalLanguage } from "../helpers/format-date";
import { ACTIONS, PLANE_PRIORITIES } from "../helpers/constants";
import { convertUnicodeToSlackEmoji } from "../helpers/emoji-converter";

export const createSlackLinkback = (
  workspaceSlug: string,
  project: ExProject,
  members: PlaneUser[],
  state: ExState[],
  issue: ExIssue,
  isSynced: boolean,
  showLogo = false
) => {
  const targetState = state.find((s) => s.id === issue.state);

  const stateList = state.map((s) => ({
    text: {
      type: "plain_text",
      text: s.name,
      emoji: true,
    },
    value: `${issue.project}.${issue.id}.${s.id}`,
  }));

  const priorityList = PLANE_PRIORITIES.map((p) => ({
    text: {
      type: "plain_text",
      text: p.name,
      emoji: true,
    },
    value: `${issue.project}.${issue.id}.${p.id}`,
  }));

  // Create base blocks array
  const blocks: any[] = [];

  if (showLogo) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "image",
          image_url: "https://res.cloudinary.com/ddglxo0l3/image/upload/v1732200793/xljpcpmftawmjkv4x61s.png",
          alt_text: "Plane",
        },
        {
          type: "mrkdwn",
          text: `*Plane*`,
        },
      ],
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `<${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}| ${project.identifier}-${issue.sequence_id} ${issue.name}>`,
    },
  });

  // Create context elements array with only non-empty values
  const contextElements: any[] = [];

  if (project.name) {
    contextElements.push({
      type: "mrkdwn",
      text: `${project.logo_props && project.logo_props.emoji ? convertUnicodeToSlackEmoji(project.logo_props.emoji.value) : ""} <${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue.project}/issues|${project.name}>`,
    });
  }

  // Add state and priority labels
  const stateLabel = targetState ? `*State:* ${targetState.name}` : "*State:* Not set";
  const priorityLabel = issue.priority ? `*Priority:* ${titleCaseWord(issue.priority)}` : "*Priority:* Not set";

  contextElements.push({
    type: "mrkdwn",
    text: `${stateLabel}    ${priorityLabel}`,
  });

  if (issue.assignees && issue.assignees.length > 0) {
    const uniqueAssignees = Array.from(new Set(issue.assignees));

    const firstAssignee = members.find((m) => m.id === uniqueAssignees[0]);

    contextElements.push({
      type: "mrkdwn",
      text: `*${uniqueAssignees.length > 1 ? "Assignees:" : "Assignee:"}*  ${firstAssignee?.display_name} ${uniqueAssignees.length > 1 ? `and ${uniqueAssignees.length - 1} others` : ""}`,
    });
  }

  if (issue.target_date) {
    contextElements.push({
      type: "plain_text",
      text: `Target Date: ${formatTimestampToNaturalLanguage(issue.target_date)}`,
    });
  }

  // Add context block if there are any elements
  if (contextElements.length > 0) {
    blocks.push({
      type: "context",
      elements: contextElements,
    });
  }

  if (isSynced) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "image",
          image_url: "https://res.cloudinary.com/ddglxo0l3/image/upload/v1732200793/xljpcpmftawmjkv4x61s.png",
          alt_text: "Plane",
        },
        {
          type: "mrkdwn",
          text: `*Synced with Plane*`,
        },
      ],
    });
  }

  blocks.push({
    type: "divider",
  });

  // Create action elements array
  const actionElements: any[] = [];

  // Add state select with label
  if (stateList.length > 0) {
    actionElements.push({
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: "Select state",
        emoji: true,
      },
      options: stateList,
      action_id: ACTIONS.LINKBACK_STATE_CHANGE,
    });
  }

  // Add priority select with label
  if (issue.priority) {
    actionElements.push({
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: "Select priority",
        emoji: true,
      },
      options: priorityList,
      action_id: ACTIONS.LINKBACK_SWITCH_PRIORITY,
    });
  }

  // Add overflow menu for button actions
  const overflowMenu = {
    type: "overflow",
    action_id: ACTIONS.LINKBACK_OVERFLOW_ACTIONS,
    options: [
      {
        text: {
          type: "plain_text",
          text: "Add Link",
          emoji: true,
        },
        value: `${issue.project}.${issue.id}`,
      },
      {
        text: {
          type: "plain_text",
          text: "Comment",
          emoji: true,
        },
        value: `${issue.project}.${issue.id}`,
      },
      {
        text: {
          type: "plain_text",
          text: "Assign to me",
          emoji: true,
        },
        value: `${issue.project}.${issue.id}`,
      },
    ],
  };

  actionElements.push(overflowMenu);

  // Add actions block if there are any elements
  if (actionElements.length > 0) {
    blocks.push({
      type: "actions",
      elements: actionElements,
    });
  }

  return { blocks };
};

function titleCaseWord(word: string) {
  if (!word) return word;
  return word[0].toUpperCase() + word.substr(1).toLowerCase();
}
