import { ENTITIES } from "../helpers/constants";
import { E_MESSAGE_ACTION_TYPES, MetadataPayloadShort } from "../types/types";

export const createWebLinkModal = (payload: MetadataPayloadShort) => {
  return {
    type: "modal",
    callback_id: E_MESSAGE_ACTION_TYPES.ISSUE_WEBLINK_SUBMISSION,
    private_metadata: JSON.stringify({ entityType: ENTITIES.ISSUE_WEBLINK_SUBMISSION, entityPayload: payload }),
    title: {
      type: "plain_text",
      text: "Create Web Link",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "Submit",
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
        element: {
          type: "plain_text_input",
          placeholder: {
            type: "plain_text",
            text: "Enter link label",
          },
        },
        label: {
          type: "plain_text",
          text: "Display Title",
          emoji: true,
        },
      },
      {
        type: "input",
        element: {
          type: "url_text_input",
          placeholder: {
            type: "plain_text",
            text: "Enter URL",
          },
        },
        label: {
          type: "plain_text",
          text: "Web URL 🔗",
          emoji: true,
        },
      },
    ],
  };
};
