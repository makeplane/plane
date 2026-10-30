/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { stringToEmoji } from "@plane/blocks/emoji-icon-picker";
import { EmojiReactionGroup, EmojiReactionPicker } from "@plane/blocks/emoji-reaction";
import type { EmojiReactionType } from "@plane/blocks/emoji-reaction";
import { setToast } from "@plane/blocks/toast";
import type { IUser } from "@plane/types";
// hooks
// ui
import { cn } from "@plane/utils";
// helpers
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
// types

export type TIssueReaction = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  currentUser: IUser;
  disabled?: boolean;
  className?: string;
};

export const IssueReaction = observer(function IssueReaction(props: TIssueReaction) {
  const { t } = useTranslation();

  const { workspaceSlug, projectId, issueId, currentUser, disabled = false, className = "" } = props;
  // state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // hooks
  const {
    reaction: { getReactionsByIssueId, reactionsByUser, getReactionById },
    createReaction,
    removeReaction,
  } = useIssueDetail();
  const { getUserDetails } = useMember();

  const reactionIds = getReactionsByIssueId(issueId);
  const userReactions = reactionsByUser(issueId, currentUser.id).map((r) => r.reaction);

  const issueReactionOperations = useMemo(
    () => ({
      create: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await createReaction(workspaceSlug, projectId, issueId, reaction);
          setToast({
            title: t("success"),
            type: "success",
            message: t("web_ui.reaction_created_successfully"),
          });
        } catch (_error) {
          setToast({
            title: t("error"),
            type: "error",
            message: t("web_ui.reaction_creation_failed"),
          });
        }
      },
      remove: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId || !currentUser?.id) throw new Error("Missing fields");
          await removeReaction(workspaceSlug, projectId, issueId, reaction, currentUser.id);
          setToast({
            title: t("success"),
            type: "success",
            message: t("web_ui.reaction_removed_successfully"),
          });
        } catch (_error) {
          setToast({
            title: t("error"),
            type: "error",
            message: t("web_ui.reaction_remove_failed"),
          });
        }
      },
      react: async (reaction: string) => {
        if (userReactions.includes(reaction)) await issueReactionOperations.remove(reaction);
        else await issueReactionOperations.create(reaction);
      },
    }),
    [t, workspaceSlug, projectId, issueId, currentUser, createReaction, removeReaction, userReactions]
  );

  // Transform reactions data to Propel EmojiReactionType format
  const reactions: EmojiReactionType[] = useMemo(() => {
    const getReactionUsers = (reaction: string): string[] => {
      const reactionUsers = (reactionIds?.[reaction] || [])
        .map((reactionId) => {
          const reactionDetails = getReactionById(reactionId);
          return reactionDetails
            ? getUserDetails(reactionDetails?.actor)?.display_name || reactionDetails?.display_name
            : null;
        })
        .filter((displayName): displayName is string => !!displayName);

      return reactionUsers;
    };

    if (!reactionIds) return [];

    return Object.keys(reactionIds)
      .filter((reaction) => reactionIds[reaction]?.length > 0)
      .map((reaction) => ({
        emoji: stringToEmoji(reaction),
        count: reactionIds[reaction].length,
        reacted: userReactions.includes(reaction),
        users: getReactionUsers(reaction),
      }));
  }, [reactionIds, userReactions, getReactionById, getUserDetails]);

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
    <div className={cn("relative mt-4", className)}>
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
