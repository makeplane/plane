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

import { useMemo } from "react";
// plane imports
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TCommentsOperations, TFileSignedURLResponse } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { formatTextList } from "@plane/utils";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import { useTeamspaceUpdates } from "@/plane-web/hooks/store";

export const useCommentOperations = (
  workspaceSlug: string | undefined,
  teamspaceId: string | undefined
): TCommentsOperations => {
  // store hooks
  const {
    createTeamspaceComment,
    updateTeamspaceComment,
    deleteTeamspaceComment,
    addCommentReaction,
    deleteCommentReaction,
    getCommentReactionsByCommentId,
    getCommentReactionById,
    commentReactionsByUser,
  } = useTeamspaceUpdates();
  const { getUserDetails } = useMember();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  const { data: currentUser } = useUser();

  const operations: TCommentsOperations = useMemo(() => {
    // Define operations object with all methods
    const ops: TCommentsOperations = {
      copyCommentLink: () => "",
      createComment: async (data) => {
        try {
          if (!workspaceSlug || !teamspaceId) throw new Error("Missing fields");
          const comment = await createTeamspaceComment(workspaceSlug, teamspaceId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment created successfully.",
          });
          return comment;
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment creation failed. Please try again later.",
          });
        }
      },
      updateComment: async (commentId, data) => {
        try {
          if (!workspaceSlug || !teamspaceId) throw new Error("Missing fields");
          await updateTeamspaceComment(workspaceSlug, teamspaceId, commentId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment updated successfully.",
          });
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment update failed. Please try again later.",
          });
        }
      },
      removeComment: async (commentId) => {
        try {
          if (!workspaceSlug || !teamspaceId) throw new Error("Missing fields");
          await deleteTeamspaceComment(workspaceSlug, teamspaceId, commentId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment removed successfully.",
          });
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment remove failed. Please try again later.",
          });
        }
      },
      uploadCommentAsset: async (blockId, file: File, commentId): Promise<TFileSignedURLResponse> => {
        try {
          if (!workspaceSlug) throw new Error("Missing fields");
          const res = await uploadEditorAsset({
            blockId,
            data: {
              entity_identifier: commentId ?? "",
              entity_type: EFileAssetType.TEAM_SPACE_COMMENT_DESCRIPTION,
            },
            file,
            workspaceSlug,
          });
          return res;
        } catch (error) {
          console.log("Error in uploading comment asset:", error);
          throw error;
        }
      },
      addCommentReaction: async (commentId, reactionEmoji) => {
        try {
          if (!workspaceSlug || !teamspaceId) throw new Error("Missing fields");
          await addCommentReaction(workspaceSlug, teamspaceId, commentId, { reaction: reactionEmoji });
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
      deleteCommentReaction: async (commentId, reactionEmoji) => {
        try {
          if (!workspaceSlug || !teamspaceId || !currentUser?.id) throw new Error("Missing fields");
          await deleteCommentReaction(workspaceSlug, teamspaceId, commentId, currentUser.id, reactionEmoji);
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
      react: async (commentId, reactionEmoji, userReactions) => {
        if (userReactions.includes(reactionEmoji)) {
          await ops.deleteCommentReaction(commentId, reactionEmoji);
        } else {
          await ops.addCommentReaction(commentId, reactionEmoji);
        }
      },
      reactionIds: (commentId) => getCommentReactionsByCommentId(commentId),
      userReactions: (commentId) =>
        currentUser && commentReactionsByUser(commentId, currentUser?.id).map((r) => r.reaction),
      getReactionUsers: (reaction, reactionIds) => {
        const reactionUsers = (reactionIds?.[reaction] || [])
          .map((reactionId) => {
            const reactionDetails = getCommentReactionById(reactionId);
            return reactionDetails ? getUserDetails(reactionDetails.actor)?.display_name : null;
          })
          .filter((displayName): displayName is string => !!displayName);
        const formattedUsers = formatTextList(reactionUsers);
        return formattedUsers;
      },
      duplicateCommentAsset: async (assetId, commentId) => {
        try {
          if (!workspaceSlug) throw new Error("Missing fields");
          const res = await duplicateEditorAsset({
            assetId,
            entityId: commentId,
            entityType: EFileAssetType.TEAM_SPACE_COMMENT_DESCRIPTION,
            workspaceSlug,
          });
          return res;
        } catch {
          throw new Error("Asset duplication failed. Please try again later.");
        }
      },
    };
    return ops;
  }, [
    workspaceSlug,
    teamspaceId,
    createTeamspaceComment,
    updateTeamspaceComment,
    uploadEditorAsset,
    deleteTeamspaceComment,
    duplicateEditorAsset,
    getCommentReactionsByCommentId,
    getCommentReactionById,
    commentReactionsByUser,
    addCommentReaction,
    deleteCommentReaction,
    currentUser,
    getUserDetails,
  ]);

  return operations;
};
