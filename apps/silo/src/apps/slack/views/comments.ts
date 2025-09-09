import { encapsulateInQuoteBlock } from "@/helpers/utils";
import { getCommentDmAlertText } from "../helpers/activity";
import { ACTIONS, ENTITIES } from "../helpers/constants";
import { getUserMarkdown } from "../helpers/user";
import { TSlackDMBlockFormationCtx } from "../types/alerts";
import { E_MESSAGE_ACTION_TYPES, MetadataPayloadShort } from "../types/types";

type TSlackCommentLinkbackProps = {
  blockFormationCtx: TSlackDMBlockFormationCtx;
  workItemHyperlink: string;
  projectId: string;
  issueId: string;
  createdBy: string;
};

export const createCommentLinkback = (props: TSlackCommentLinkbackProps) => {
  const { blockFormationCtx, workItemHyperlink, projectId, issueId } = props;
  const { workspaceSlug, actorDisplayName } = blockFormationCtx;
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: getCommentDmAlertText(workspaceSlug, actorDisplayName, workItemHyperlink),
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: encapsulateInQuoteBlock(blockFormationCtx.parsedMarkdownFromAlert),
      },
    },
    {
      type: "divider",
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Work Item",
          },
          url: blockFormationCtx.workItemDisplayInfo.url,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Reply",
          },
          value: `${projectId}.${issueId}`,
          action_id: ACTIONS.CREATE_REPLY_COMMENT,
        },
      ],
    },
  ];
};

type TSyncedCommentBlock = {
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

export const createSyncedSlackCommentBlock = (commentProps: TSyncedCommentBlock) => {
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
          text: isUser
            ? "Synced from Plane"
            : `Commented from Plane by ${getUserMarkdown(userMap, workspaceSlug, createdById, createdByDisplayName)}`,
        },
      ],
    },
  ];
};

export const createReplyCommentModal = (payload: MetadataPayloadShort, replyCommentBlocks: any[] = []) => ({
  type: "modal",
  private_metadata: JSON.stringify({ entityType: ENTITIES.ISSUE_COMMENT_SUBMISSION, entityPayload: payload }),
  callback_id: E_MESSAGE_ACTION_TYPES.ISSUE_COMMENT_SUBMISSION,
  title: {
    type: "plain_text",
    text: replyCommentBlocks ? "Reply to Comment" : "Comment",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: replyCommentBlocks ? "Reply" : "Comment",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Discard",
    emoji: true,
  },
  blocks: [
    ...replyCommentBlocks,
    {
      type: "input" as const,
      optional: false,
      element: {
        type: "rich_text_input" as const,
        action_id: ACTIONS.LINKBACK_COMMENT_SUBMIT,
        placeholder: {
          type: "plain_text" as const,
          text: replyCommentBlocks ? "Add your reply here" : "Enter your comment here",
        },
      },
      label: {
        type: "plain_text" as const,
        text: replyCommentBlocks ? "Add your reply here" : "Enter your comment here",
        emoji: true,
      },
    },
  ],
});
