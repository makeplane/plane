import React from "react";

// hooks
import useUser from "hooks/use-user";
import useCommentReaction from "hooks/use-comment-reaction";
// ui
import { ReactionSelector } from "components/core";
// helper
import { renderEmoji } from "helpers/emoji.helper";

type Props = {
  workspaceSlug?: string | string[];
  projectId?: string | string[];
  commentId: string;
};

export const CommentReaction: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId, commentId } = props;

  const { user } = useUser();

  const {
    commentReactions,
    groupedReactions,
    handleReactionCreate,
    handleReactionDelete,
    isLoading,
  } = useCommentReaction(workspaceSlug, projectId, commentId);

  const handleReactionClick = (reaction: string) => {
    if (!workspaceSlug || !projectId || !commentId) return;

    const isSelected = commentReactions?.some(
      (r) => r.actor === user?.id && r.reaction === reaction
    );

    if (isSelected) {
      handleReactionDelete(reaction);
    } else {
      handleReactionCreate(reaction);
    }
  };

  return (
    <div className="flex gap-1.5 items-center mt-2">
      <ReactionSelector
        size="md"
        position="top"
        value={
          commentReactions
            ?.filter((reaction) => reaction.actor === user?.id)
            .map((r) => r.reaction) || []
        }
        onSelect={handleReactionClick}
      />

      {Object.keys(groupedReactions || {}).map(
        (reaction) =>
          groupedReactions?.[reaction]?.length &&
          groupedReactions[reaction].length > 0 && (
            <button
              type="button"
              onClick={() => {
                handleReactionClick(reaction);
              }}
              key={reaction}
              className={`flex items-center gap-1 text-custom-text-100 h-full px-2 py-1 rounded-md ${
                commentReactions?.some((r) => r.actor === user?.id && r.reaction === reaction)
                  ? "bg-custom-primary-100/10"
                  : "bg-custom-background-80"
              }`}
            >
              <span>{groupedReactions?.[reaction].length} </span>
              <span>{renderEmoji(reaction)}</span>
            </button>
          )
      )}
    </div>
  );
};
