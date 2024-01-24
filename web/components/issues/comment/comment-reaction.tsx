import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
import useCommentReaction from "hooks/use-comment-reaction";
// ui
// import { ReactionSelector } from "components/core";
// helper
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IssueCommentReaction } from "@plane/types";

type Props = {
  projectId?: string | string[];
  commentId: string;
  readonly?: boolean;
};

export const CommentReaction: FC<Props> = observer((props) => {
  const { projectId, commentId, readonly = false } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { currentUser } = useUser();

  const { commentReactions, groupedReactions, handleReactionCreate, handleReactionDelete } = useCommentReaction(
    workspaceSlug,
    projectId,
    commentId
  );

  const handleReactionClick = (reaction: string) => {
    if (!workspaceSlug || !projectId || !commentId) return;

    const isSelected = commentReactions?.some(
      (r: IssueCommentReaction) => r.actor === currentUser?.id && r.reaction === reaction
    );

    if (isSelected) {
      handleReactionDelete(reaction);
    } else {
      handleReactionCreate(reaction);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {/* FIXME: have to replace this once the issue details page is ready --issue-detail-- */}
      {/* {!readonly && (
        <ReactionSelector
          size="md"
          position="top"
          value={
            commentReactions
              ?.filter((reaction: IssueCommentReaction) => reaction.actor === currentUser?.id)
              .map((r: IssueCommentReaction) => r.reaction) || []
          }
          onSelect={handleReactionClick}
        />
      )} */}

      {Object.keys(groupedReactions || {}).map(
        (reaction) =>
          groupedReactions?.[reaction]?.length &&
          groupedReactions[reaction].length > 0 && (
            <button
              type="button"
              disabled={readonly}
              onClick={() => {
                handleReactionClick(reaction);
              }}
              key={reaction}
              className={`flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100 ${
                commentReactions?.some(
                  (r: IssueCommentReaction) => r.actor === currentUser?.id && r.reaction === reaction
                )
                  ? "bg-custom-primary-100/10"
                  : "bg-custom-background-80"
              }`}
            >
              <span>{renderEmoji(reaction)}</span>
              <span
                className={
                  commentReactions?.some(
                    (r: IssueCommentReaction) => r.actor === currentUser?.id && r.reaction === reaction
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
