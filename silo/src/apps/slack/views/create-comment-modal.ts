import { ACTIONS, ENTITIES } from "../helpers/constants";

export const createCommentModal = (issueName: string, payload?: any) => ({
  type: "modal",
  private_metadata: JSON.stringify({ entityType: ENTITIES.ISSUE_COMMENT_SUBMISSION, entityPayload: payload }),
  title: {
    type: "plain_text",
    text: "Create Comment",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: "Create",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true,
  },
  blocks: [
    {
      type: "input",
      optional: true,
      element: {
        type: "plain_text_input",
        action_id: ACTIONS.LINKBACK_COMMENT_SUBMIT,
        multiline: true,
        placeholder: {
          type: "plain_text",
          text: "Enter your comment here",
        },
      },
      label: {
        type: "plain_text",
        text: "Issue Comment",
        emoji: true,
      },
    },
  ],
});
