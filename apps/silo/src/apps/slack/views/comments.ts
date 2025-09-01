import { getUserMarkdown } from "../helpers/user";

type CommentProps = {
  // Comment information
  comment: string;
  createdById: string;
  createdByDisplayName?: string;

  // Issue detail for which the comment was made
  workspaceSlug: string;
  projectId: string;
  issueId: string;

  // UserMap, as we need to mention the user if the relation exist
  userMap: Map<string, string>;

  // Whether the comment is from a user or from a bot
  isUser: boolean;
};

export const createSlackCommentBlock = (commentProps: CommentProps) => {
  const { comment, createdById, createdByDisplayName, workspaceSlug, userMap, isUser } = commentProps;

  // Add the title for the comment being added
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${comment}`,
      },
    },
    {
      type: "divider",
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: isUser ? "Synced from Plane" : `Commented from Plane by ${getUserMarkdown(userMap, workspaceSlug, createdById, createdByDisplayName)}`,
        },
      ],
    },
  ];
};
