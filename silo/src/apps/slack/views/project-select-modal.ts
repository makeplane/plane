import { ACTIONS, ENTITIES, EntityTypeValue } from "../helpers/constants";
import { PlainTextOption } from "../helpers/slack-options";
import { E_MESSAGE_ACTION_TYPES, ShortcutActionPayload } from "../types/types";

export const createProjectSelectionModal = (
  projects: Array<PlainTextOption>,
  privateMetadata: ShortcutActionPayload,
  type: EntityTypeValue = ENTITIES.SHORTCUT_PROJECT_SELECTION
) => ({
  type: "modal",
  callback_id: E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM,
  private_metadata: JSON.stringify({
    entityType: type,
    entityPayload: privateMetadata,
  }),
  title: {
    type: "plain_text",
    text: "Create Issue",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Discard Issue",
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
  ],
});
