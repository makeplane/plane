import { IssueWithExpanded } from "@plane/sdk";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { invertStringMap } from "@/helpers/utils";
import {
  createSlackLinkbackMutationContext,
  E_MUTATION_CONTEXT_FORMAT_TYPE,
  E_MUTATION_CONTEXT_ITEM_TYPE,
} from "../helpers/blocks";
import { ACTIONS } from "../helpers/constants";
import { getUserMarkdown } from "../helpers/user";

export const createSlackLinkback = (
  workspaceSlug: string,
  issue: IssueWithExpanded<["state", "project", "assignees", "labels", "created_by", "updated_by"]>,
  userMap: Map<string, string>,
  isSynced: boolean,
  hideActions: boolean = false
) => {
  const blocks: any[] = [];

  const planeToSlackUserMap = invertStringMap(userMap);

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `<${getIssueUrlFromSequenceId(workspaceSlug, issue.project.identifier ?? "", issue.sequence_id.toString())}|*${issue.project.identifier}-${issue.sequence_id} ${issue.name}*>`,
    },
  });

  // Build markdown content for main section (fallback to mrkdwn for compatibility)
  let sectionContent = `> *Project*: ${issue.project.name}`;

  if (issue.state) {
    sectionContent += `\n> *State*: ${issue.state.name}`;
  }

  if (issue.priority && issue.priority !== "none") {
    sectionContent += `\n> *Priority*: ${issue.priority}`;
  }

  if (issue.assignees.length > 0) {
    const assigneeLabel = issue.assignees.length > 1 ? "Assignees" : "Assignee";
    const assignee =
      issue.assignees.length > 1
        ? issue.assignees
            .map((a) => getUserMarkdown(planeToSlackUserMap, workspaceSlug, a.id, a.display_name))
            .join(", ")
        : getUserMarkdown(planeToSlackUserMap, workspaceSlug, issue.assignees[0].id, issue.assignees[0].display_name);

    sectionContent += `\n> *${assigneeLabel}*: ${assignee}`;
  }

  if (issue.target_date) {
    sectionContent += `\n> *Target Date*: ${issue.target_date}`;
  }

  // Main section with issue details using mrkdwn for compatibility
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: sectionContent,
    },
  });

  // Divider
  blocks.push({
    type: "divider",
  });

  // Build markdown content for creation/update info
  const mutationContext = createSlackLinkbackMutationContext({
    issueCtx: {
      createdBy: issue.created_by,
      updatedBy: issue.updated_by,
    },
    planeToSlackUserMap,
    workspaceSlug,
    options: {
      itemType: E_MUTATION_CONTEXT_ITEM_TYPE.WORK_ITEM,
      format: E_MUTATION_CONTEXT_FORMAT_TYPE.CREATION_AND_UPDATE,
    },
  });

  // Context with creation and update info using mrkdwn
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: mutationContext,
      },
    ],
  });

  const actions: any[] = [
    {
      type: "button",
      text: {
        type: "plain_text",
        text: "View in Plane",
        emoji: true,
      },
      url: getIssueUrlFromSequenceId(workspaceSlug, issue.project.identifier ?? "", issue.sequence_id.toString()),
      action_id: "view_in_plane",
    },
  ];

  if (!hideActions) {
    actions.push(
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Assign to me",
          emoji: true,
        },
        value: `${issue.project.id}.${issue.id}`,
        action_id: ACTIONS.ASSIGN_TO_ME,
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Update Work Item",
          emoji: true,
        },
        value: `${issue.project.id}.${issue.id}`,
        action_id: ACTIONS.UPDATE_WORK_ITEM,
      }
    );
  }

  // Action buttons
  blocks.push({
    type: "actions",
    elements: actions,
  });

  // Thread sync info (optional) using mrkdwn
  if (isSynced) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: ":information_source: All slack messages in this thread will be synced to Plane work item as comments",
        },
      ],
    });
  }

  return { blocks };
};
