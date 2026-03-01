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
import useSWR from "swr";
// plane imports
import { stringToEmoji } from "@plane/propel/emoji-icon-picker";
import { EmojiReactionGroup, EmojiReactionPicker } from "@plane/propel/emoji-reaction";
import type { EmojiReactionType } from "@plane/propel/emoji-reaction";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectReactions } from "@/plane-web/hooks/store/projects/use-project-reactions";

export type TProjectReaction = {
  workspaceSlug: string;
  projectId: string;
  currentUser: IUser | undefined;
  disabled?: boolean;
};

export const ProjectReaction = observer(function ProjectReaction(props: TProjectReaction) {
  const { workspaceSlug, projectId, currentUser, disabled = false } = props;

  // state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // hooks
  const {
    fetchProjectReactions,
    createProjectReaction,
    getProjectReactionsByProjectId,
    reactionsByUser,
    removeProjectReaction,
  } = useProjectReactions();
  const { getUserDetails } = useMember();

  const reactionIds = getProjectReactionsByProjectId(projectId);
  const userReactions = currentUser ? reactionsByUser(projectId, currentUser.id).map((r) => r.reaction) : [];

  // api calls
  useSWR(
    projectId && workspaceSlug ? `PROJECT_REACTIONS_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchProjectReactions(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const projectReactionOperations = useMemo(
    () => ({
      create: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId) {
            console.error("Missing required fields:", { workspaceSlug, projectId });
            throw new Error("Missing fields");
          }

          console.log("Creating reaction with:", { workspaceSlug, projectId, reaction });
          const response = await createProjectReaction(workspaceSlug, projectId, reaction);
          console.log("Reaction created successfully:", response);

          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction created successfully",
          });
        } catch (error) {
          console.error("Error creating reaction:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Failed to create reaction",
          });
          throw error;
        }
      },
      remove: async (reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !currentUser) throw new Error("Missing fields");
          await removeProjectReaction(workspaceSlug, projectId, reaction, currentUser.id);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Reaction removed successfully",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Reaction removal failed",
          });
        }
      },
      react: (reaction: string) => {
        if (userReactions.includes(reaction)) projectReactionOperations.remove(reaction);
        else projectReactionOperations.create(reaction);
      },
    }),
    [workspaceSlug, projectId, currentUser, createProjectReaction, removeProjectReaction, userReactions]
  );

  const getReactionUsers = (reaction: string): string[] => {
    if (!reactionIds || typeof reactionIds !== "object" || !Array.isArray(reactionIds?.[reaction])) {
      return [];
    }

    const _users = reactionIds[reaction]
      .map((r) => getUserDetails(r.actor)?.display_name)
      .filter((name): name is string => !!name);
    return _users;
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
    projectReactionOperations.react(reactionString);
  };

  const handleEmojiSelect = (emoji: string) => {
    // emoji is already in decimal string format from EmojiReactionPicker
    projectReactionOperations.react(emoji);
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
