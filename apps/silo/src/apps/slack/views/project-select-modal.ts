import { ACTIONS, ENTITIES, EntityTypeValue } from "../helpers/constants";
import { PlainTextOption } from "../helpers/slack-options";
import { E_MESSAGE_ACTION_TYPES, ShortcutActionPayload } from "../types/types";

export const createProjectSelectionModal = (
  projects: Array<PlainTextOption>,
  privateMetadata: ShortcutActionPayload,
  type: EntityTypeValue = ENTITIES.SHORTCUT_PROJECT_SELECTION,
  isWorkItem: boolean = true,
  error: string = ""
) => ({
  type: "modal",
  callback_id: isWorkItem ? E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM : E_MESSAGE_ACTION_TYPES.CREATE_INTAKE_ISSUE,
  private_metadata: JSON.stringify({
    entityType: type,
    entityPayload: privateMetadata,
  }),
  title: {
    type: "plain_text",
    text: isWorkItem ? "Create Work Item" : "Create Intake Issue",
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
        options: projects,
        action_id: ACTIONS.PROJECT,
      },
      label: {
        type: "plain_text",
        text: "Project",
        emoji: true,
      },
    },
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
});
