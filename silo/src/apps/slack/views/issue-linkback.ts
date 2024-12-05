import { env } from "@/env";
import { ExCycle, ExIssue, ExProject, ExState } from "@plane/sdk";
import { formatTimestampToNaturalLanguage } from "../helpers/format-date";
import { ACTIONS, PLANE_PRIORITIES } from "../helpers/constants";

export const createSlackLinkback = (
  workspaceSlug: string,
  project: ExProject,
  state: ExState[],
  cycles: ExCycle[],
  issue: ExIssue
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

  const cycleList = cycles.map((c) => ({
    text: {
      type: "plain_text",
      text: c.name,
      emoji: true,
    },
    value: `${issue.project}.${issue.id}.${c.id}`,
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
  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}|[${project.identifier}-${issue.sequence_id}] ${issue.name}>`,
      },
    },
  ];

  // Only add description if it exists
  if (issue.description_stripped) {
    blocks.push({
      type: "rich_text",
      elements: [
        {
          type: "rich_text_preformatted",
          elements: [
            {
              type: "text",
              text: issue.description_stripped,
            },
          ],
        },
      ],
    });
  }

  // Create context elements array with only non-empty values
  const contextElements: any[] = [
    {
      type: "image",
      image_url: "https://res.cloudinary.com/ddglxo0l3/image/upload/v1729791794/i552wnxgd1qnbzpyzvst.gif",
      alt_text: "Plane",
    },
  ];

  if (project.name) {
    contextElements.push({
      type: "mrkdwn",
      text: `<${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue.project}/issues|${project.name}>`,
    });
  }

  if (targetState?.name) {
    contextElements.push({
      type: "mrkdwn",
      text: `*State*  ${targetState.name}`,
    });
  }

  if (issue.created_at) {
    contextElements.push({
      type: "plain_text",
      text: formatTimestampToNaturalLanguage(issue.created_at),
      emoji: true,
    });
  }

  // Add context block if there are any elements
  if (contextElements.length > 0) {
    blocks.push({
      type: "context",
      elements: contextElements,
    });
  }

  blocks.push({
    type: "divider",
  });

  // Create action elements array
  const actionElements: any[] = [];

  // Add state select if states exist
  if (stateList.length > 0) {
    actionElements.push({
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: targetState?.name || "Select state",
        emoji: true,
      },
      options: stateList,
      action_id: ACTIONS.LINKBACK_STATE_CHANGE,
    });
  }

  // Add assign to me button
  actionElements.push({
    type: "button",
    text: {
      type: "plain_text",
      text: "Assign to me",
      emoji: true,
    },
    value: `${issue.project}.${issue.id}`,
    action_id: ACTIONS.ASSIGN_TO_ME,
  });

  // Add comment button
  actionElements.push({
    type: "button",
    text: {
      type: "plain_text",
      text: "Comment",
      emoji: true,
    },
    value: `${issue.project}.${issue.id}`,
    action_id: ACTIONS.LINKBACK_CREATE_COMMENT,
  });

  // Add priority select if priority exists
  if (issue.priority) {
    actionElements.push({
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: titleCaseWord(issue.priority),
        emoji: true,
      },
      options: priorityList,
      action_id: ACTIONS.LINKBACK_SWITCH_PRIORITY,
    });
  }

  // Add cycles select only if cycles exist
  if (cycles && cycles.length > 0) {
    actionElements.push({
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: "Select cycle",
        emoji: true,
      },
      options: cycleList,
      action_id: ACTIONS.LINKBACK_SWITCH_CYCLE,
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
