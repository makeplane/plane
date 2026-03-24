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

import type { PlainTextElement } from "@slack/types";
import type { ExState, IssueWithExpanded } from "@plane/sdk";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { ACTIONS, ENTITIES } from "../helpers/constants";
import { E_MESSAGE_ACTION_TYPES } from "../types/types";
import { sanitizeSlackMrkdwn } from "../helpers/slack-options";

export type LinkIssueModalView = {
  type: "modal";
  callback_id: string;
  private_metadata: string;
  title: PlainTextElement;
  submit: PlainTextElement;
  close: PlainTextElement;
  blocks: any;
};

/**
 * Creates a modal view for linking existing issues
 * @param privateMetadata Metadata to pass through the modal (JSON string)
 * @returns A configured modal view
 */
export const createLinkIssueModalView = (
  privateMetadata: any = {},
  error: string | null = null
): LinkIssueModalView => ({
  type: "modal",
  callback_id: E_MESSAGE_ACTION_TYPES.LINK_WORK_ITEM,
  private_metadata: JSON.stringify({
    entityType: ENTITIES.LINK_WORK_ITEM,
    entityPayload: privateMetadata,
  }),
  title: {
    type: "plain_text",
    text: "Link Work Item",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: "Link",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true,
  },
  blocks: [
    ...(error
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: error,
            },
          },
        ]
      : []),
    {
      type: "input",
      block_id: "work_item_select",
      element: {
        type: "external_select",
        placeholder: {
          type: "plain_text",
          text: "Type a few letters of the work item title or it's id",
          emoji: true,
        },
        min_query_length: 2,
        action_id: ACTIONS.LINK_WORK_ITEM,
        focus_on_load: true,
      },
      label: {
        type: "plain_text",
        text: "Work Items",
        emoji: true,
      },
    },
  ],
});

/**
 * Creates a modal view for already linked issues
 * @param workspaceSlug The workspace slug
 * @param project The project details
 * @param state The issue state
 * @param issue The issue that is already linked
 * @param assignees Optional array of assignee users
 * @returns A configured modal view with issue context
 */
export const alreadyLinkedModalView = (
  workspaceSlug: string,
  issue: IssueWithExpanded<["state", "project", "assignees", "labels", "created_by", "updated_by"]>,
  states: ExState[],
  userMap: Map<string, string>,
  privateMetadata: any = {}
) => ({
  type: "modal",
  callback_id: E_MESSAGE_ACTION_TYPES.DISCONNECT_WORK_ITEM,
  private_metadata: JSON.stringify({
    entityType: ENTITIES.DISCONNECT_WORK_ITEM,
    entityPayload: { ...privateMetadata },
  }),
  title: {
    type: "plain_text",
    text: "Linked Work Item",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: "Delink",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true,
  },
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "You can only link one work item to a Slack thread. To connect this thread to a different work item, first delink the current work item.",
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `> <${getIssueUrlFromSequenceId(workspaceSlug, issue.project.identifier!, issue.sequence_id.toString())}|${issue.project.identifier}-${issue.sequence_id}>\n> ${sanitizeSlackMrkdwn(issue.name)}`,
      },
    },
  ],
});
