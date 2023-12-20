export const getSlackMessageTemplate = (message: {
  activityString: string;
  plainTextActivityString: string;
}) => ({
  text: `${
    message.plainTextActivityString === ""
      ? message.activityString
      : message.plainTextActivityString
  }`,
  blocks: [
    // {
    //   type: "header",
    //   text: {
    //     type: "plain_text",
    //     text: `${issue.name}`,
    //     emoji: true,
    //   },
    // },
    // {
    //   type: "section",
    //   fields: [
    //     {
    //       type: "mrkdwn",
    //       text: `*Issue Id:*\n${issue.projects.identifier}-${issue.sequence_id}`,
    //     },
    //   ],
    // },
    // {
    //   type: "section",
    //   text: {
    //     type: "mrkdwn",
    //     text: `*Activity:*\n ${message.activityString}`,
    //   },
    // },
    // {
    //   type: "section",
    //   text: {
    //     type: "mrkdwn",
    //     text: `<${process.env.WEB_URL}/${issue.projects.workspaces.slug}/projects/${issue.project_id}/issues/${issue.id}|View Issue>`,
    //   },
    // },
  ],
});
