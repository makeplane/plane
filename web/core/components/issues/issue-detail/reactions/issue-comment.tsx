"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { IUser } from "@plane/types";
// components
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// helper
import { cn } from "@/helpers/common.helper";
import { renderEmoji } from "@/helpers/emoji.helper";
import { formatTextList } from "@/helpers/issue.helper";
// hooks
import { useIssueDetail, useMember } from "@/hooks/store";
// types
import { ReactionSelector } from "./reaction-selector";

export type TIssueCommentReaction = {
  workspaceSlug: string;
  projectId: string;
  commentId: string;
  currentUser: IUser;
  disabled?: boolean;
};

export const IssueCommentReaction: FC<TIssueCommentReaction> = observer((props) => {
  const { workspaceSlug, projectId, commentId, currentUser, disabled = false } = props;

  // hooks
  const {
    commentReaction: { getCommentReactionsByCommentId, commentReactionsByUser, getCommentReactionById },
    createCommentReaction,
    removeCommentReaction,
  } = useIssueDetail();
  const { getUserDetails } = useMember();

  const reactionIds = getCommentReactionsByCommentId(commentId);
  const userReactions = commentReactionsByUser(commentId, currentUser.id).map((r) => r.reaction);

  const issueCommentReactionOperations = useMemo(
    () => ({
      create: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !commentId) throw new Error("Missing fields");
          await createCommentReaction(workspaceSlug, projectId, commentId, reaction);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction created successfully",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Reaction creation failed",
          });
        }
      },
      remove: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !commentId || !currentUser?.id) throw new Error("Missing fields");
          removeCommentReaction(workspaceSlug, projectId, commentId, reaction, currentUser.id);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction removed successfully",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Reaction remove failed",
          });
        }
      },
      react: async (reaction: string) => {
        if (userReactions.includes(reaction)) await issueCommentReactionOperations.remove(reaction);
        else await issueCommentReactionOperations.create(reaction);
      },
    }),
    [workspaceSlug, projectId, commentId, currentUser, createCommentReaction, removeCommentReaction, userReactions]
  );

  const getReactionUsers = (reaction: string): string => {
    const reactionUsers = (reactionIds?.[reaction] || [])
      .map((reactionId) => {
        const reactionDetails = getCommentReactionById(reactionId);
        return reactionDetails ? getUserDetails(reactionDetails.actor)?.display_name : null;
      })
      .filter((displayName): displayName is string => !!displayName);
    const formattedUsers = formatTextList(reactionUsers);
    return formattedUsers;
  };

  return (
    <div className="relative mt-4 flex items-center gap-1.5">
      {!disabled && (
        <ReactionSelector
          size="md"
          position="top"
          value={userReactions}
          onSelect={issueCommentReactionOperations.react}
        />
      )}

      {reactionIds &&
        Object.keys(reactionIds || {}).map(
          (reaction) =>
            reactionIds[reaction]?.length > 0 && (
              <>
                <Tooltip tooltipContent={getReactionUsers(reaction)}>
                  <button
                    type="button"
                    onClick={() => !disabled && issueCommentReactionOperations.react(reaction)}
                    key={reaction}
                    className={cn(
                      "flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100",
                      userReactions.includes(reaction) ? "bg-custom-primary-100/10" : "bg-custom-background-80",
                      {
                        "cursor-not-allowed": disabled,
                      }
                    )}
                  >
                    <span>{renderEmoji(reaction)}</span>
                    <span className={userReactions.includes(reaction) ? "text-custom-primary-100" : ""}>
                      {(reactionIds || {})[reaction].length}{" "}
                    </span>
                  </button>
                </Tooltip>
              </>
            )
        )}
    </div>
  );
});
