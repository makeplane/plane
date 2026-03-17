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

import type { EntityTypeValue } from "../helpers/constants";
import { ACTIONS, ENTITIES, E_ISSUE_OBJECT_TYPE_SELECTION } from "../helpers/constants";
import type { PlainTextOption } from "../helpers/slack-options";
import type { ShortcutActionPayload } from "../types/types";
import { E_MESSAGE_ACTION_TYPES } from "../types/types";
import { buildOptionGroups } from "../helpers/slack-options";

export const createProjectSelectionModal = (
  projects: Array<PlainTextOption>,
  privateMetadata: ShortcutActionPayload,
  selectedProject?: string,
  type: EntityTypeValue = ENTITIES.SHORTCUT_PROJECT_SELECTION,
  showIntakeDropdown: boolean = false,
  error: string = ""
) => {
  const { option_groups, initial_option } = buildOptionGroups(projects, 50, selectedProject);

  return {
    type: "modal",
    callback_id: E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM,
    private_metadata: JSON.stringify({
      entityType: type,
      entityPayload: privateMetadata,
    }),
    title: {
      type: "plain_text",
      text: "Create",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Discard",
      emoji: true,
    },
    blocks: [
      {
        dispatch_action: true,
        type: "input",
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select a Project",
            emoji: true,
          },
          option_groups,
          initial_option,
          action_id: ACTIONS.PROJECT,
        },
        label: {
          type: "plain_text",
          text: "Project",
          emoji: true,
        },
      },
      ...(showIntakeDropdown && selectedProject
        ? [
            {
              dispatch_action: true,
              type: "input",
              element: {
                type: "static_select",
                placeholder: {
                  type: "plain_text",
                  text: "Work Item or Intake",
                  emoji: true,
                },
                options: [
                  {
                    text: {
                      type: "plain_text",
                      text: "Work Item",
                      emoji: true,
                    },
                    value: `${selectedProject}.${E_ISSUE_OBJECT_TYPE_SELECTION.WORK_ITEM}`,
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "Intake",
                      emoji: true,
                    },
                    value: `${selectedProject}.${E_ISSUE_OBJECT_TYPE_SELECTION.INTAKE}`,
                  },
                ],
                action_id: ACTIONS.ISSUE_OBJECT_TYPE_SELECTION,
              },
              label: {
                type: "plain_text",
                text: "Add as",
                emoji: true,
              },
            },
          ]
        : []),
      ...(error
        ? [
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `:warning: *Error:* ${error}`,
                },
              ],
            },
          ]
        : []),
    ],
  };
};
