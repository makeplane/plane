import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Tooltip } from "@plane/ui";
// ui
import { ReactionSelector } from "@/components/ui";
// helpers
import { groupReactions, renderEmoji } from "@/helpers/emoji.helper";
// hooks
import { useMobxStore, useUser } from "@/hooks/store";

type Props = {
  commentId: string;
  projectId: string;
};

export const CommentReactions: React.FC<Props> = observer((props) => {
  const { commentId, projectId } = props;

  const router = useRouter();
  const { workspace_slug } = router.query;
  // hooks
  const { issueDetails: issueDetailsStore } = useMobxStore();
  const { data: user } = useUser();

  const peekId = issueDetailsStore.peekId;
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

  // TODO: on onclick redirect to login page if the user is not logged in
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <ReactionSelector
        onSelect={(value) => {
          if (user) handleReactionClick(value);
          // userStore.requiredLogin(() => {});
        }}
        position="top"
        selected={userReactions?.map((r) => r.reaction)}
        size="md"
      />

      {Object.keys(groupedReactions || {}).map((reaction) => {
        const reactions = groupedReactions?.[reaction] ?? [];
        const REACTIONS_LIMIT = 1000;

        if (reactions.length > 0)
          return (
            <Tooltip
              key={reaction}
              tooltipContent={
                <div>
                  {reactions
                    .map((r) => r.actor_detail.display_name)
                    .splice(0, REACTIONS_LIMIT)
                    .join(", ")}
                  {reactions.length > REACTIONS_LIMIT && " and " + (reactions.length - REACTIONS_LIMIT) + " more"}
                </div>
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (user) handleReactionClick(reaction);
                  // userStore.requiredLogin(() => {});
                }}
                className={`flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100 ${
                  commentReactions?.some((r) => r.actor_detail.id === user?.id && r.reaction === reaction)
                    ? "bg-custom-primary-100/10"
                    : "bg-custom-background-80"
                }`}
              >
                <span>{renderEmoji(reaction)}</span>
                <span
                  className={
                    commentReactions?.some((r) => r.actor_detail.id === user?.id && r.reaction === reaction)
                      ? "text-custom-primary-100"
                      : ""
                  }
                >
                  {groupedReactions?.[reaction].length}{" "}
                </span>
              </button>
            </Tooltip>
          );
      })}
    </div>
  );
});
