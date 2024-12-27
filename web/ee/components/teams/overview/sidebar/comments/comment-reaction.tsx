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
import { useTeamUpdates } from "@/plane-web/hooks/store/teams/use-team-updates";
import { TTeamComment, TTeamReaction } from "@/plane-web/types";

export type TTeamCommentReaction = {
  workspaceSlug: string;
  teamId: string;
  comment: TTeamComment;
  disabled?: boolean;
};

function getGroupedReactions(reactions: TTeamReaction[] | undefined) {
  const groupedReactions: { [key: string]: TTeamReaction[] } = {};

  if (!reactions) return groupedReactions;

  for (const reaction of reactions) {
    const reactionEmoji = reaction.reaction;
    if (!groupedReactions[reactionEmoji]) groupedReactions[reactionEmoji] = [];

    groupedReactions[reactionEmoji].push(reaction);
  }

  return groupedReactions;
}

export const TeamCommentReactions: FC<TTeamCommentReaction> = observer((props) => {
  const { workspaceSlug, teamId, comment, disabled = false } = props;
  // store hooks
  const { addCommentReaction, deleteCommentReaction } = useTeamUpdates();
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  // derived values
  const reactions = comment.comment_reactions;
  const groupedReactionEmojis = getGroupedReactions(reactions);
  const userReactions = reactions?.filter((reaction) => reaction.actor === currentUser?.id);
  const userReactionEmojis = userReactions?.map((reaction) => reaction.reaction) ?? [];

  const issueReactionOperations = useMemo(
    () => ({
      create: async (reactionEmoji: string) => {
        try {
          if (!workspaceSlug || !teamId) throw new Error("Missing fields");
          await addCommentReaction(workspaceSlug, teamId, comment.id, { reaction: reactionEmoji });
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction created successfully",
          });
        } catch {
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
          if (!workspaceSlug || !teamId || !currentUser?.id || !userReaction) throw new Error("Missing fields");
          await deleteCommentReaction(workspaceSlug, teamId, comment.id, userReaction.id, userReaction.reaction);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction removed successfully",
          });
        } catch {
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
    [workspaceSlug, teamId, comment, currentUser, addCommentReaction, deleteCommentReaction, userReactions]
  );

  const getReactionUsers = (reactionEmoji: string): string => {
    const reactionUsers = (groupedReactionEmojis?.[reactionEmoji] || [])
      .map((reaction) => (reaction ? getUserDetails(reaction.actor)?.display_name : null))
      .filter((displayName): displayName is string => !!displayName);
    const formattedUsers = formatTextList(reactionUsers);
    return formattedUsers;
  };

  return (
    <div className="relative flex items-center gap-1.5">
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
