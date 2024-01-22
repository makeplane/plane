import { FC, useMemo } from "react";
import { observer } from "mobx-react-lite";
// components
import { ReactionSelector } from "./reaction-selector";
// hooks
import { useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// types
import { IUser } from "@plane/types";
import { renderEmoji } from "helpers/emoji.helper";

export type TIssueCommentReaction = {
  workspaceSlug: string;
  projectId: string;
  commentId: string;
  currentUser: IUser;
};

export const IssueCommentReaction: FC<TIssueCommentReaction> = observer((props) => {
  const { workspaceSlug, projectId, commentId, currentUser } = props;

  // hooks
  const {
    commentReaction: { getCommentReactionsByCommentId, commentReactionsByUser },
    createCommentReaction,
    removeCommentReaction,
  } = useIssueDetail();
  const { setToastAlert } = useToast();

  const reactionIds = getCommentReactionsByCommentId(commentId);
  const userReactions = commentReactionsByUser(commentId, currentUser.id).map((r) => r.reaction);

  const issueCommentReactionOperations = useMemo(
    () => ({
      create: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !commentId) throw new Error("Missing fields");
          await createCommentReaction(workspaceSlug, projectId, commentId, reaction);
          setToastAlert({
            title: "Reaction created successfully",
            type: "success",
            message: "Reaction created successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Reaction creation failed",
            type: "error",
            message: "Reaction creation failed",
          });
        }
      },
      remove: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !commentId || !currentUser?.id) throw new Error("Missing fields");
          removeCommentReaction(workspaceSlug, projectId, commentId, reaction, currentUser.id);
          setToastAlert({
            title: "Reaction removed successfully",
            type: "success",
            message: "Reaction removed successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Reaction remove failed",
            type: "error",
            message: "Reaction remove failed",
          });
        }
      },
      react: async (reaction: string) => {
        if (userReactions.includes(reaction)) await issueCommentReactionOperations.remove(reaction);
        else await issueCommentReactionOperations.create(reaction);
      },
    }),
    [
      workspaceSlug,
      projectId,
      commentId,
      currentUser,
      createCommentReaction,
      removeCommentReaction,
      setToastAlert,
      userReactions,
    ]
  );

  return (
    <div className="mt-4 relative flex items-center gap-1.5">
      <ReactionSelector
        size="md"
        position="top"
        value={userReactions}
        onSelect={issueCommentReactionOperations.react}
      />

      {reactionIds &&
        Object.keys(reactionIds || {}).map(
          (reaction) =>
            reactionIds[reaction]?.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => issueCommentReactionOperations.react(reaction)}
                  key={reaction}
                  className={`flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100 ${
                    userReactions.includes(reaction) ? "bg-custom-primary-100/10" : "bg-custom-background-80"
                  }`}
                >
                  <span>{renderEmoji(reaction)}</span>
                  <span className={userReactions.includes(reaction) ? "text-custom-primary-100" : ""}>
                    {(reactionIds || {})[reaction].length}{" "}
                  </span>
                </button>
              </>
            )
        )}
    </div>
  );
});
