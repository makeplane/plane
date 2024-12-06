import { ACTIONS } from "../helpers/constants";
import { PlainTextOption } from "../helpers/slack-options";

export const createProjectSelectionModal = (projects: Array<PlainTextOption>, privateMetadata: string = "{}") => ({
  type: "modal",
  private_metadata: privateMetadata,
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
