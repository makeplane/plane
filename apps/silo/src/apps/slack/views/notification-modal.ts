export const notificationModal = (notifcationsText: string[]) => ({
  type: "Notifications",
  title: {
    type: "plain_text",
    text: "Plane",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true,
  },
  blocks: notifcationsText.map((notification: string) => ({
    type: "section",
    text: {
      type: "plain_text",
      text: notification,
      emoji: true,
    },
  })),
});
