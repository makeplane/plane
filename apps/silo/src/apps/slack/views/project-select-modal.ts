import { ACTIONS, ENTITIES, EntityTypeValue, E_ISSUE_OBJECT_TYPE_SELECTION } from "../helpers/constants";
import { PlainTextOption } from "../helpers/slack-options";
import { E_MESSAGE_ACTION_TYPES, ShortcutActionPayload } from "../types/types";

export const createProjectSelectionModal = (
  projects: Array<PlainTextOption>,
  privateMetadata: ShortcutActionPayload,
  selectedProject?: string,
  type: EntityTypeValue = ENTITIES.SHORTCUT_PROJECT_SELECTION,
  showIntakeDropdown: boolean = false,
  error: string = ""
) => ({
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
        options: projects,
        initial_option: projects.find((project) => project.value === selectedProject),
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
});
