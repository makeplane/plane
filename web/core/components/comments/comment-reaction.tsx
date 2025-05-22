"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// Plane
import { TCommentsOperations, TIssueComment } from "@plane/types";
import { Tooltip } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { ReactionSelector } from "@/components/issues";
// helpers
import { renderEmoji } from "@/helpers/emoji.helper";

export type TProps = {
  comment: TIssueComment;
  disabled?: boolean;
  activityOperations: TCommentsOperations;
};

export const CommentReactions: FC<TProps> = observer((props) => {
  const { comment, activityOperations, disabled = false } = props;

  const userReactions = activityOperations.userReactions(comment.id);
  const reactionIds = activityOperations.reactionIds(comment.id);

  if (!userReactions) return null;
  return (
    <div className="relative flex items-center gap-1.5">
      {!disabled && (
        <ReactionSelector
          size="md"
          position="top"
          value={userReactions}
          onSelect={(reactionEmoji) => activityOperations.react(comment.id, reactionEmoji, userReactions)}
        />
      )}

      {reactionIds &&
        Object.keys(reactionIds || {}).map(
          (reaction: string) =>
            reactionIds[reaction]?.length > 0 && (
              <>
                <Tooltip tooltipContent={activityOperations.getReactionUsers(reaction, reactionIds)}>
                  <button
                    type="button"
                    onClick={() => !disabled && activityOperations.react(comment.id, reaction, userReactions)}
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
