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
import { stringToEmoji } from "@plane/propel/emoji-icon-picker";
import { EmojiReactionGroup, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import type { EmojiReactionType } from "@plane/propel/emoji-reaction";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeReaction } from "@/types/initiative";

export type TIssueReaction = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeReactions = observer(function InitiativeReactions(props: TIssueReaction) {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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
  const getReactionUsers = (reactionEmoji: string): string[] => {
    const reactionUsers = (groupedReactionEmojis?.[reactionEmoji] || [])
      .map((reaction) => (reaction ? getUserDetails(reaction.actor)?.display_name : null))
      .filter((displayName): displayName is string => !!displayName);

    return reactionUsers;
  };

  const userReactionEmojis = userReactions?.map((reaction) => reaction.reaction) ?? [];

  // Transform reactions data to Propel EmojiReactionType format
  const reactionsList: EmojiReactionType[] = useMemo(() => {
    if (!groupedReactionEmojis) return [];

    return Object.keys(groupedReactionEmojis)
      .filter((reactionEmoji) => groupedReactionEmojis[reactionEmoji]?.length > 0)
      .map((reactionEmoji) => ({
        emoji: stringToEmoji(reactionEmoji),
        count: groupedReactionEmojis[reactionEmoji].length,
        reacted: userReactionEmojis.includes(reactionEmoji),
        users: getReactionUsers(reactionEmoji),
      }));
  }, [groupedReactionEmojis, userReactionEmojis]);

  const handleReactionClick = (emoji: string) => {
    if (disabled) return;
    // Convert emoji back to decimal string format for the API
    const emojiCodePoints = Array.from(emoji).map((char) => char.codePointAt(0));
    const reactionString = emojiCodePoints.join("-");
    issueReactionOperations.react(reactionString);
  };

  const handleEmojiSelect = (emoji: string) => {
    // emoji is already in decimal string format from EmojiReactionPicker
    issueReactionOperations.react(emoji);
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
            reactions={reactionsList}
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
