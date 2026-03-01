/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { stringToEmoji } from "@plane/propel/emoji-icon-picker";
import { EmojiReactionGroup, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import type { EmojiReactionType } from "@plane/propel/emoji-reaction";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EUpdateEntityType, IUser, TUpdateOperations } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
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

export const UpdateReaction = observer(function UpdateReaction(props: TUpdateReaction) {
  const {
    workspaceSlug,
    entityId,
    commentId,
    currentUser,
    disabled = false,
    handleUpdateOperations,
    entityType,
  } = props;

  // state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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

  const getReactionUsers = (reaction: string): string[] => {
    const reactionUsers = (reactionIds?.[reaction] || [])
      .map((reactionDetails) => (reactionDetails ? getUserDetails(reactionDetails.actor)?.display_name : null))
      .filter((displayName): displayName is string => !!displayName);

    return reactionUsers;
  };

  // Transform reactions data to Propel EmojiReactionType format
  const reactions: EmojiReactionType[] = useMemo(() => {
    if (!reactionIds) return [];

    return Object.keys(reactionIds)
      .filter((reaction) => reactionIds[reaction]?.length > 0)
      .map((reaction) => ({
        emoji: stringToEmoji(reaction),
        count: reactionIds[reaction].length,
        reacted: userReactions.includes(reaction),
        users: getReactionUsers(reaction),
      }));
  }, [reactionIds, userReactions]);

  const handleReactionClick = (emoji: string) => {
    if (disabled) return;
    // Convert emoji back to decimal string format for the API
    const emojiCodePoints = Array.from(emoji).map((char) => char.codePointAt(0));
    const reactionString = emojiCodePoints.join("-");
    updateReactionOperations.react(reactionString);
  };

  const handleEmojiSelect = (emoji: string) => {
    // emoji is already in decimal string format from EmojiReactionPicker
    updateReactionOperations.react(emoji);
  };

  return (
    <div className="relative flex items-center gap-1.5">
      <EmojiReactionPicker
        isOpen={isPickerOpen}
        handleToggle={setIsPickerOpen}
        onChange={handleEmojiSelect}
        disabled={disabled}
        label={
          <EmojiReactionGroup
            reactions={reactions}
            onReactionClick={handleReactionClick}
            showAddButton={!disabled}
            onAddReaction={() => setIsPickerOpen(true)}
          />
        }
        placement="bottom-start"
      />
    </div>
  );
});
