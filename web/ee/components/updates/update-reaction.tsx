"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { IUser, TUpdateOperations } from "@plane/types";
// components
import { EUpdateEntityType } from "@plane/types/src/enums";
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// helper
import { ReactionSelector } from "@/components/issues";
import { cn } from "@/helpers/common.helper";
import { renderEmoji } from "@/helpers/emoji.helper";
// hooks
import { formatTextList } from "@/helpers/issue.helper";
import { useMember } from "@/hooks/store";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";

export type TUpdateReaction = {
  workspaceSlug: string;
  entityId: string;
  commentId: string;
  currentUser: IUser | undefined;
  disabled?: boolean;
  handleUpdateOperations: TUpdateOperations;
  entityType: EUpdateEntityType;
};

export const UpdateReaction: FC<TUpdateReaction> = observer((props) => {
  const {
    workspaceSlug,
    entityId,
    commentId,
    currentUser,
    disabled = false,
    handleUpdateOperations,
    entityType,
  } = props;

  // hooks
  const {
    reactions: { getUpdateReactionsByUpdateId, reactionsByUser },
  } = useUpdateDetail(entityType);
  const { getUserDetails } = useMember();
  const { t } = useTranslation();

  const reactionIds = getUpdateReactionsByUpdateId(commentId);
  const userReactions = currentUser ? reactionsByUser(commentId, currentUser.id).map((r) => r.reaction) : [];
  const { createReaction, removeReaction } = handleUpdateOperations;
  const updateReactionOperations = useMemo(
    () => ({
      create: async (reaction: string) => {
        try {
          if (!workspaceSlug || !entityId || !commentId) throw new Error("Missing fields");
          await createReaction(commentId, reaction);
          setToast({
            title: t("updates.reaction.create.success.title"),
            type: TOAST_TYPE.SUCCESS,
            message: t("updates.reaction.create.success.message"),
          });
        } catch (error) {
          setToast({
            title: t("updates.reaction.create.error.title"),
            type: TOAST_TYPE.ERROR,
            message: t("updates.reaction.create.error.message"),
          });
        }
      },
      remove: async (reaction: string) => {
        try {
          if (!workspaceSlug || !entityId || !commentId || !currentUser?.id) throw new Error("Missing fields");
          await removeReaction(commentId, reaction);
          setToast({
            title: t("updates.reaction.remove.success.title"),
            type: TOAST_TYPE.SUCCESS,
            message: t("updates.reaction.remove.success.message"),
          });
        } catch (error) {
          setToast({
            title: t("updates.reaction.remove.error.title"),
            type: TOAST_TYPE.ERROR,
            message: t("updates.reaction.remove.error.message"),
          });
        }
      },
      react: async (reaction: string) => {
        if (userReactions.includes(reaction)) await updateReactionOperations.remove(reaction);
        else await updateReactionOperations.create(reaction);
      },
    }),
    [workspaceSlug, entityId, commentId, currentUser, createReaction, removeReaction, userReactions]
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
              <Tooltip tooltipContent={getReactionUsers(reaction)} key={reaction}>
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
            )
        )}
    </div>
  );
});
