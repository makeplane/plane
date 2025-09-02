"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
// hooks
// ui
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
import { cn, formatTextList } from "@plane/utils";
// components
import { ReactionSelector } from "@/components/issues/issue-detail/reactions";
// helpers
import { renderEmoji } from "@/helpers/emoji.helper";
// hooks
import { useMember } from "@/hooks/store/use-member"
import { useUser } from "@/hooks/store/user";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeReaction } from "@/plane-web/types/initiative";

export type TIssueReaction = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeReactions: FC<TIssueReaction> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // hooks
  const {
    initiative: { getInitiativeById, addInitiativeReaction, deleteInitiativeReaction },
  } = useInitiatives();
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();

  const reactions = getInitiativeById(initiativeId)?.reactions;
  const userReactions = reactions?.filter((reaction) => reaction.actor === currentUser?.id);

  const issueReactionOperations = useMemo(
    () => ({
      create: async (reactionEmoji: string) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          await addInitiativeReaction(workspaceSlug, initiativeId, { reaction: reactionEmoji });
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

          await deleteInitiativeReaction(workspaceSlug, initiativeId, userReaction.id, userReaction.reaction);
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
    [workspaceSlug, initiativeId, currentUser, addInitiativeReaction, deleteInitiativeReaction, userReactions]
  );

  const groupedReactionEmojis = getGroupedReactions(reactions);

  // get Reaction Users
  const getReactionUsers = (reactionEmoji: string): string => {
    const reactionUsers = (groupedReactionEmojis?.[reactionEmoji] || [])
      .map((reaction) => (reaction ? getUserDetails(reaction.actor)?.display_name : null))
      .filter((displayName): displayName is string => !!displayName);

    const formattedUsers = formatTextList(reactionUsers);
    return formattedUsers;
  };

  const userReactionEmojis = userReactions?.map((reaction) => reaction.reaction) ?? [];
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
