import { ExState, IssueWithExpanded } from "@plane/sdk";
import { env } from "@/env";
import { ACTIONS, PLANE_PRIORITIES } from "../helpers/constants";
import { convertUnicodeToSlackEmoji } from "../helpers/emoji-converter";
import { formatTimestampToNaturalLanguage } from "../helpers/format-date";

export const createSlackLinkback = (
  workspaceSlug: string,
  issue: IssueWithExpanded<["state", "project", "assignees", "labels"]>,
  states: ExState[],
  isSynced: boolean,
  showLogo = false,
  hideOverflowMenu = false,
  asHeader = false
) => {
  const stateList = states.map((s) => ({
    text: {
      type: "plain_text",
      text: s.name,
      emoji: true,
    },
    value: `${issue.project.id}.${issue.id}.${s.id}`,
  }));

  const priorityList = PLANE_PRIORITIES.map((p) => ({
    text: {
      type: "plain_text",
      text: p.name,
      emoji: true,
    },
    value: `${issue.project.id}.${issue.id}.${p.id}`,
  }));

  // Create base blocks array
  const blocks: any[] = [];

  if (showLogo) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "image",
          image_url: "https://media.docs.plane.so/logo/favicon-512x512.png",
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
      text: asHeader
        ? `*${issue.project.identifier}-${issue.sequence_id} ${issue.name}*`
        : `<${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue.project.id}/issues/${issue.id}| ${issue.project.identifier}-${issue.sequence_id} ${issue.name}>`,
    },
  });

  // Create context elements array with only non-empty values
  const contextElements: any[] = [];

  if (issue.project.name) {
    const emoji =
      issue.project.logo_props &&
        issue.project.logo_props?.in_use === "emoji" &&
        issue.project.logo_props?.emoji &&
        issue.project.logo_props?.emoji?.value
        ? convertUnicodeToSlackEmoji(issue.project.logo_props?.emoji?.value)
        : "📋";

    contextElements.push({
      type: "mrkdwn",
      text: `${emoji} <${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue.project.id}/issues|${issue.project.name}>`,
    });
  }

  // Add state and priority labels
  const stateLabel = issue.state ? `*State:* ${issue.state.name}` : "*State:* Not set";
  const priorityLabel = issue.priority ? `*Priority:* ${titleCaseWord(issue.priority)}` : "*Priority:* Not set";

  contextElements.push({
    type: "mrkdwn",
    text: `${stateLabel}    ${priorityLabel}`,
  });

  if (issue.assignees && issue.assignees.length > 0) {
    const uniqueAssignees = Array.from(new Set(issue.assignees));
    const firstAssignee = issue.assignees.find((m) => m.id === uniqueAssignees[0].id);

    contextElements.push({
      type: "mrkdwn",
      text: `*${uniqueAssignees.length > 1 ? "Assignees:" : "Assignee:"}*  ${firstAssignee?.first_name} ${uniqueAssignees.length > 1 ? `and ${uniqueAssignees.length - 1} others` : ""}`,
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
          image_url: "https://media.docs.plane.so/logo/favicon-512x512.png",
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
  if (!hideOverflowMenu) {
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
          value: `${issue.project.id}.${issue.id}`,
        },
        {
          text: {
            type: "plain_text",
            text: "Comment",
            emoji: true,
          },
          value: `${issue.project.id}.${issue.id}`,
        },
        {
          text: {
            type: "plain_text",
            text: "Assign to me",
            emoji: true,
          },
          value: `${issue.project.id}.${issue.id}`,
        },
      ],
    };

    actionElements.push(overflowMenu);
  }

  if (hideOverflowMenu) {
    // Give a button for assign to me
    actionElements.push({
      type: "button",
      text: {
        type: "plain_text",
        text: "Assign to me",
      },
      value: `${issue.project.id}.${issue.id}`,
    });
  }

  if (asHeader) {
    actionElements.push({
      type: "button",
      text: {
        type: "plain_text",
        text: "Open in Plane",
      },
      url: `${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue.project.id}/issues/${issue.id}`,
    });
  }

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
