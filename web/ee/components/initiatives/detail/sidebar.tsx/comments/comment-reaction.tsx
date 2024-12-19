"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
// Plane
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { ReactionSelector } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderEmoji } from "@/helpers/emoji.helper";
import { formatTextList } from "@/helpers/issue.helper";
// hooks
import { useMember, useUser } from "@/hooks/store";
// PLane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeComment, TInitiativeReaction } from "@/plane-web/types/initiative";

export type TInitiativeCommentReaction = {
  workspaceSlug: string;
  initiativeId: string;
  comment: TInitiativeComment;
  disabled?: boolean;
};

function getGroupedReactions(reactions: TInitiativeReaction[] | undefined) {
  const groupedReactions: { [key: string]: TInitiativeReaction[] } = {};

  if (!reactions) return groupedReactions;

  for (const reaction of reactions) {
    const reactionEmoji = reaction.reaction;
    if (!groupedReactions[reactionEmoji]) groupedReactions[reactionEmoji] = [];

    groupedReactions[reactionEmoji].push(reaction);
  }

  return groupedReactions;
}

export const InitiativeCommentReactions: FC<TInitiativeCommentReaction> = observer((props) => {
  const { workspaceSlug, initiativeId, comment, disabled = false } = props;
  // hooks
  const {
    initiative: {
      initiativeCommentActivities: { addCommentReaction, deleteCommentReaction },
    },
  } = useInitiatives();
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();

  const reactions = comment.comment_reactions;
  const userReactions = reactions?.filter((reaction) => reaction.actor === currentUser?.id);

  const issueReactionOperations = useMemo(
    () => ({
      create: async (reactionEmoji: string) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          await addCommentReaction(workspaceSlug, initiativeId, comment.id, { reaction: reactionEmoji });
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
      remove: async (reactionEmoji: string) => {
        try {
          const userReaction = userReactions?.find((reaction) => reaction.reaction === reactionEmoji);
          if (!workspaceSlug || !initiativeId || !currentUser?.id || !userReaction) throw new Error("Missing fields");

          await deleteCommentReaction(workspaceSlug, initiativeId, comment.id, userReaction.id, userReaction.reaction);
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
      react: async (reactionEmoji: string) => {
        const userReaction = userReactions?.find((reaction) => reaction.reaction === reactionEmoji);
        if (userReaction) await issueReactionOperations.remove(reactionEmoji);
        else await issueReactionOperations.create(reactionEmoji);
      },
    }),
    [workspaceSlug, initiativeId, comment, currentUser, addCommentReaction, deleteCommentReaction, userReactions]
  );

  const groupedReactionEmojis = getGroupedReactions(reactions);

  const getReactionUsers = (reactionEmoji: string): string => {
    const reactionUsers = (groupedReactionEmojis?.[reactionEmoji] || [])
      .map((reaction) => {
        return reaction ? getUserDetails(reaction.actor)?.display_name : null;
      })
      .filter((displayName): displayName is string => !!displayName);

    const formattedUsers = formatTextList(reactionUsers);
    return formattedUsers;
  };

  const userReactionEmojis = userReactions?.map((reaction) => reaction.reaction) ?? [];
  return (
    <div className="relative mt-4 flex items-center gap-1.5">
      {!disabled && (
        <ReactionSelector
          size="md"
          position="top"
          value={userReactionEmojis}
          onSelect={issueReactionOperations.react}
        />
      )}
      {groupedReactionEmojis &&
        Object.keys(groupedReactionEmojis || {}).map(
          (reactionEmoji) =>
            groupedReactionEmojis[reactionEmoji]?.length > 0 && (
              <>
                <Tooltip tooltipContent={getReactionUsers(reactionEmoji)}>
                  <button
                    type="button"
                    onClick={() => !disabled && issueReactionOperations.react(reactionEmoji)}
                    key={reactionEmoji}
                    className={cn(
                      "flex h-full items-center gap-1 rounded-md px-2 py-1 text-sm text-custom-text-100",
                      userReactionEmojis.includes(reactionEmoji)
                        ? "bg-custom-primary-100/10"
                        : "bg-custom-background-80",
                      {
                        "cursor-not-allowed": disabled,
                      }
                    )}
                  >
                    <span>{renderEmoji(reactionEmoji)}</span>
                    <span className={userReactionEmojis.includes(reactionEmoji) ? "text-custom-primary-100" : ""}>
                      {(groupedReactionEmojis || {})[reactionEmoji].length}{" "}
                    </span>
                  </button>
                </Tooltip>
              </>
            )
        )}
    </div>
  );
});
