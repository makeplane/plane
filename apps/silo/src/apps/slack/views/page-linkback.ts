import { ExPage } from "@plane/sdk";

export const createPageLinkback = (page: ExPage, pageURL: string) => {
  const description = page?.description_stripped?.slice(0, 100);
  const blocks: any[] = [];

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `<${pageURL}|${page.name}>`,
    },
  });

  if (description) {
    blocks.push(
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: description,
        },
      },
      {
        type: "divider",
      }
    );
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "View in Plane",
          emoji: true,
        },
        url: pageURL,
        action_id: "view_in_plane",
      },
    ],
  });

  return { blocks };
};
