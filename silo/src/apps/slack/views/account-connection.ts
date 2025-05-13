import { env } from "@/env";
import { E_MESSAGE_ACTION_TYPES, TSlackConnectionDetails } from "../types/types";

export const getAccountConnectionBlocks = (details: TSlackConnectionDetails) => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "To perform any updates to Plane from Slack, please connect your account using the button below",
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          action_id: E_MESSAGE_ACTION_TYPES.CONNECT_ACCOUNT,
          text: {
            type: "plain_text",
            text: "Connect Account",
            emoji: true,
          },
          style: "primary",
          url: `${env.APP_BASE_URL}/profile/connections?workspaceId=${details.workspaceConnection.workspace_id}`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Click the button above to open the connection page. Thanks!",
        },
      ],
    },
  ];
};
