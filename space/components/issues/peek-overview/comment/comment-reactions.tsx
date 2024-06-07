import React from "react";
import { observer } from "mobx-react-lite";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tooltip } from "@plane/ui";
// ui
import { ReactionSelector } from "@/components/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { groupReactions, renderEmoji } from "@/helpers/emoji.helper";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails, useUser } from "@/hooks/store";
import useIsInIframe from "@/hooks/use-is-in-iframe";

type Props = {
  commentId: string;
  projectId: string;
  workspaceSlug: string;
};

export const CommentReactions: React.FC<Props> = observer((props) => {
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;

  const { commentId, projectId, workspaceSlug } = props;
  // hooks
  const { addCommentReaction, removeCommentReaction, details, peekId } = useIssueDetails();
  const { data: user } = useUser();
  const isInIframe = useIsInIframe();

  const commentReactions = peekId ? details[peekId].comments.find((c) => c.id === commentId)?.comment_reactions : [];
  const groupedReactions = peekId ? groupReactions(commentReactions ?? [], "reaction") : {};

  const userReactions = commentReactions?.filter((r) => r?.actor_detail?.id === user?.id);

  const handleAddReaction = (reactionHex: string) => {
    if (!workspaceSlug || !projectId || !peekId) return;
    addCommentReaction(workspaceSlug, projectId, peekId, commentId, reactionHex);
  };

  const handleRemoveReaction = (reactionHex: string) => {
    if (!workspaceSlug || !projectId || !peekId) return;
    removeCommentReaction(workspaceSlug, projectId, peekId, commentId, reactionHex);
  };

  const handleReactionClick = (reactionHex: string) => {
    const userReaction = userReactions?.find((r) => r.actor_detail.id === user?.id && r.reaction === reactionHex);

    if (userReaction) handleRemoveReaction(reactionHex);
    else handleAddReaction(reactionHex);
  };

  // derived values
  const { queryParam } = queryParamGenerator({ peekId, board, state, priority, labels });

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {!isInIframe && (
        <ReactionSelector
          onSelect={(value) => {
            if (user) handleReactionClick(value);
            else router.push(`/?next_path=${pathName}?${queryParam}`);
          }}
          position="top"
          selected={userReactions?.map((r) => r.reaction)}
          size="md"
        />
      )}

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
                    .map((r) => r?.actor_detail?.display_name)
                    .splice(0, REACTIONS_LIMIT)
                    .join(", ")}
                  {reactions.length > REACTIONS_LIMIT && " and " + (reactions.length - REACTIONS_LIMIT) + " more"}
                </div>
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (isInIframe) return;
                  if (user) handleReactionClick(reaction);
                  else router.push(`/?next_path=${pathName}?${queryParam}`);
                }}
                className={cn(
                  `flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100 ${
                    commentReactions?.some((r) => r?.actor_detail?.id === user?.id && r.reaction === reaction)
                      ? "bg-custom-primary-100/10"
                      : "bg-custom-background-80"
                  }`,
                  {
                    "cursor-default": isInIframe,
                  }
                )}
              >
                <span>{renderEmoji(reaction)}</span>
                <span
                  className={
                    commentReactions?.some((r) => r?.actor_detail?.id === user?.id && r.reaction === reaction)
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
