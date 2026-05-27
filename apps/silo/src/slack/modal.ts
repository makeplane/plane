/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Slack Block Kit view for the "Create Work Item" modal opened from
 * the /plane slash command. v1: project picker, title, description.
 * Submission handler lands in the interactions router.
 */

import type { SlackTeamProject } from "./team-context";

export const CREATE_WORK_ITEM_CALLBACK = "plane_create_work_item";

export type CreateWorkItemMetadata = {
  workspaceSlug: string;
  channelId: string;
  triggerUserId: string;
  installerUserId: string | null;
};

export const buildCreateWorkItemView = (
  projects: SlackTeamProject[],
  metadata: CreateWorkItemMetadata,
  initialText = ""
): Record<string, unknown> => {
  const projectOptions = projects.slice(0, 100).map((p) => ({
    text: { type: "plain_text", text: `${p.identifier} — ${p.name}`.slice(0, 75) },
    value: p.id,
  }));

  const projectBlock: Record<string, unknown> =
    projectOptions.length > 0
      ? {
          type: "input",
          block_id: "project",
          label: { type: "plain_text", text: "Project" },
          element: {
            type: "static_select",
            action_id: "project_id",
            placeholder: { type: "plain_text", text: "Select a project" },
            options: projectOptions,
          },
        }
      : {
          type: "section",
          block_id: "no_projects",
          text: {
            type: "mrkdwn",
            text: "_No projects in this workspace yet — create one in Plane first._",
          },
        };

  return {
    type: "modal",
    callback_id: CREATE_WORK_ITEM_CALLBACK,
    private_metadata: JSON.stringify(metadata),
    title: { type: "plain_text", text: "Create work item" },
    submit: projectOptions.length > 0 ? { type: "plain_text", text: "Create" } : undefined,
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      projectBlock,
      {
        type: "input",
        block_id: "title",
        label: { type: "plain_text", text: "Title" },
        element: {
          type: "plain_text_input",
          action_id: "title",
          initial_value: initialText.slice(0, 250),
          max_length: 255,
        },
      },
      {
        type: "input",
        block_id: "description",
        optional: true,
        label: { type: "plain_text", text: "Description" },
        element: {
          type: "plain_text_input",
          action_id: "description",
          multiline: true,
        },
      },
    ],
  };
};
