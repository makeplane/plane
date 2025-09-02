"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { IUser } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { cn, formatTextList } from "@plane/utils";
// components
import { ReactionSelector } from "@/components/issues/issue-detail/reactions";
import { renderEmoji } from "@/helpers/emoji.helper";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectUpdates } from "@/plane-web/hooks/store/projects/use-project-updates";

export type TUpdateReaction = {
  workspaceSlug: string;
  projectId: string;
  commentId: string;
  currentUser: IUser | undefined;
  disabled?: boolean;
};

export const UpdateReaction: FC<TUpdateReaction> = observer((props) => {
  const { workspaceSlug, projectId, commentId, currentUser, disabled = false } = props;

  // hooks
  const {
    reactions: { createUpdateReaction, getUpdateReactionsByUpdateId, reactionsByUser, removeUpdateReaction },
  } = useProjectUpdates();
  const { getUserDetails } = useMember();

  const reactionIds = getUpdateReactionsByUpdateId(commentId);
  const userReactions = currentUser ? reactionsByUser(commentId, currentUser.id).map((r) => r.reaction) : [];

  const updateReactionOperations = useMemo(
    () => ({
      create: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !commentId) throw new Error("Missing fields");
          await createUpdateReaction(workspaceSlug, projectId, commentId, reaction);
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
      remove: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !commentId || !currentUser?.id) throw new Error("Missing fields");
          removeUpdateReaction(workspaceSlug, projectId, commentId, reaction, currentUser.id);
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
      react: async (reaction: string) => {
        if (userReactions.includes(reaction)) await updateReactionOperations.remove(reaction);
        else await updateReactionOperations.create(reaction);
      },
    }),
    [workspaceSlug, projectId, commentId, currentUser, createUpdateReaction, removeUpdateReaction, userReactions]
  );

  const getReactionUsers = (reaction: string): string => {
    const reactionUsers = (reactionIds?.[reaction] || [])
      .map((reactionDetails) => (reactionDetails ? getUserDetails(reactionDetails.actor)?.display_name : null))
      .filter((displayName): displayName is string => !!displayName);

    const formattedUsers = formatTextList(reactionUsers);
    return formattedUsers;
  };

  return (
    <div className="relative flex items-center gap-1.5">
      {!disabled && (
        <ReactionSelector size="md" position="top" value={userReactions} onSelect={updateReactionOperations.react} />
      )}

      {reactionIds &&
        Object.keys(reactionIds || {}).map(
          (reaction) =>
            reactionIds[reaction]?.length > 0 && (
              <>
                <Tooltip tooltipContent={getReactionUsers(reaction)}>
                  <button
                    type="button"
                    onClick={() => !disabled && updateReactionOperations.react(reaction)}
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
