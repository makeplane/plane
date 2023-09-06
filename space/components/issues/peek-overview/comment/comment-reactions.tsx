import React from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { ReactionSelector } from "components/ui";
// helpers
import { groupReactions, renderEmoji } from "helpers/emoji.helper";

type Props = {
  commentId: string;
  projectId: string;
};

export const CommentReactions: React.FC<Props> = observer((props) => {
  const { commentId, projectId } = props;

  const router = useRouter();
  const { workspace_slug } = router.query;

  const { issueDetails: issueDetailsStore, user: userStore } = useMobxStore();

  const peekId = issueDetailsStore.peekId;
  const user = userStore.currentUser;

  const commentReactions = peekId
    ? issueDetailsStore.details[peekId].comments.find((c) => c.id === commentId)?.comment_reactions
    : [];
  const groupedReactions = peekId ? groupReactions(commentReactions ?? [], "reaction") : {};

  const userReactions = commentReactions?.filter((r) => r.actor_detail.id === user?.id);

  const handleAddReaction = (reactionHex: string) => {
    if (!workspace_slug || !projectId || !peekId) return;

    issueDetailsStore.addCommentReaction(
      workspace_slug.toString(),
      projectId.toString(),
      peekId,
      commentId,
      reactionHex
    );
  };

  const handleRemoveReaction = (reactionHex: string) => {
    if (!workspace_slug || !projectId || !peekId) return;

    issueDetailsStore.removeCommentReaction(
      workspace_slug.toString(),
      projectId.toString(),
      peekId,
      commentId,
      reactionHex
    );
  };

  const handleReactionClick = (reactionHex: string) => {
    const userReaction = userReactions?.find((r) => r.actor_detail.id === user?.id && r.reaction === reactionHex);

    if (userReaction) handleRemoveReaction(reactionHex);
    else handleAddReaction(reactionHex);
  };

  return (
    <div className="flex gap-1.5 items-center mt-2">
      <ReactionSelector
        onSelect={(value) => {
          userStore.requiredLogin(() => {
            handleReactionClick(value);
          });
        }}
        position="top"
        selected={userReactions?.map((r) => r.reaction)}
        size="md"
      />

      {Object.keys(groupedReactions || {}).map(
        (reaction) =>
          groupedReactions?.[reaction]?.length &&
          groupedReactions[reaction].length > 0 && (
            <button
              type="button"
              onClick={() => {
                userStore.requiredLogin(() => {
                  handleReactionClick(reaction);
                });
              }}
              key={reaction}
              className={`flex items-center gap-1 text-custom-text-100 text-sm h-full px-2 py-1 rounded-md ${
                commentReactions?.some(
                  (r) => r.actor_detail.id === userStore.currentUser?.id && r.reaction === reaction
                )
                  ? "bg-custom-primary-100/10"
                  : "bg-custom-background-80"
              }`}
            >
              <span>{renderEmoji(reaction)}</span>
              <span
                className={
                  commentReactions?.some(
                    (r) => r.actor_detail.id === userStore.currentUser?.id && r.reaction === reaction
                  )
                    ? "text-custom-primary-100"
                    : ""
                }
              >
                {groupedReactions?.[reaction].length}{" "}
              </span>
            </button>
          )
      )}
    </div>
  );
});
