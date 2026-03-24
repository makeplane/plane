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

import type { IssueWithExpanded } from "@plane/sdk";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { invertStringMap } from "@/helpers/utils";
import {
  createSlackLinkbackMutationContext,
  E_MUTATION_CONTEXT_FORMAT_TYPE,
  E_MUTATION_CONTEXT_ITEM_TYPE,
} from "../helpers/blocks";
import { capitalize } from "@/helpers/generic-helpers";
import { ACTIONS } from "../helpers/constants";
import { getUserMarkdown } from "../helpers/user";
import { sanitizeSlackMrkdwn } from "../helpers/slack-options";

export const createSlackLinkback = (
  workspaceSlug: string,
  issue: IssueWithExpanded<["state", "project", "assignees", "labels", "created_by", "updated_by"]>,
  userMap: Map<string, string>,
  isSynced: boolean,
  hideActions: boolean = false,
  isUnfurled: boolean = false
) => {
  const blocks: unknown[] = [];

  const planeToSlackUserMap = invertStringMap(userMap);
  const quote = !isUnfurled ? "> " : "";

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*<${getIssueUrlFromSequenceId(workspaceSlug, issue.project.identifier ?? "", issue.sequence_id.toString())}|${issue.project.identifier}-${issue.sequence_id} ${sanitizeSlackMrkdwn(issue.name)}>*`,
    },
  });

  // Build markdown content for main section (fallback to mrkdwn for compatibility)
  let sectionContent = `${quote}*Project*: ${issue.project.name}`;

  if (issue.state) {
    sectionContent += `\n${quote}*State*: ${issue.state.name}`;
  }

  if (issue.priority && issue.priority !== "none") {
    sectionContent += `\n${quote}*Priority*: ${capitalize(issue.priority)}`;
  }

  if (issue.assignees.length > 0) {
    const assigneeLabel = issue.assignees.length > 1 ? "Assignees" : "Assignee";
    const assignee =
      issue.assignees.length > 1
        ? issue.assignees
            .map((a) => getUserMarkdown(planeToSlackUserMap, workspaceSlug, a.id, a.display_name))
            .join(", ")
        : getUserMarkdown(planeToSlackUserMap, workspaceSlug, issue.assignees[0].id, issue.assignees[0].display_name);

    sectionContent += `\n${quote}*${assigneeLabel}*: ${assignee}`;
  }

  if (issue.target_date) {
    sectionContent += `\n${quote}*Target Date*: ${issue.target_date}`;
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
  if (mutationContext?.length) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: mutationContext,
        },
      ],
    });
  }

  const actions: unknown[] = [
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
          text: "Add me to assignees",
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

    // Add Disable Sync button when sync is enabled
    if (isSynced) {
      actions.push({
        type: "button",
        text: {
          type: "plain_text",
          text: "Disable Sync",
          emoji: true,
        },
        value: `${issue.project.id}.${issue.id}`,
        action_id: ACTIONS.DISABLE_SYNC,
      });
    }
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
          text: ":information_source: All Slack messages in this thread will be synced to Plane work item as comments",
        },
      ],
    });
  }

  return { blocks };
};
