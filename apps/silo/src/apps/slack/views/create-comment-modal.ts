import { ACTIONS, ENTITIES } from "../helpers/constants";
import { E_MESSAGE_ACTION_TYPES, MetadataPayloadShort } from "../types/types";

export const createCommentModal = (payload: MetadataPayloadShort) => ({
  type: "modal",
  private_metadata: JSON.stringify({ entityType: ENTITIES.ISSUE_COMMENT_SUBMISSION, entityPayload: payload }),
  callback_id: E_MESSAGE_ACTION_TYPES.ISSUE_COMMENT_SUBMISSION,
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
