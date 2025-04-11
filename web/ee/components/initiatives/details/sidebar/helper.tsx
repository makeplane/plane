"use client";

import { useMemo } from "react";
import { useTranslation } from "@plane/i18n";
import { TCommentsOperations, TFileSignedURLResponse, TIssueComment } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { formatTextList } from "@/helpers/issue.helper";
import { useEditorAsset, useMember, useUser } from "@/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

export const useCommentOperations = (workspaceSlug: string, initiativeId: string): TCommentsOperations => {
  // store hooks
  const {
    initiative: {
      initiativeCommentActivities: {
        createInitiativeComment,
        updateInitiativeComment,
        deleteInitiativeComment,
        addCommentReaction,
        deleteCommentReaction,
        getCommentReactionsByCommentId,
        getCommentReactionById,
        commentReactionsByUser,
      },
    },
  } = useInitiatives();
  const { data: currentUser } = useUser();
  const { uploadEditorAsset } = useEditorAsset();
  const { getUserDetails } = useMember();
  // translation
  const { t } = useTranslation();

  // helper operations
  const operations = useMemo(() => {
    // Define operations object with all methods
    const ops = {
      createComment: async (data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          const comment = await createInitiativeComment(workspaceSlug, initiativeId, data);
          setToast({
            title: t("toast.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.create.success"),
          });
          return comment;
        } catch (error) {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.create.error"),
          });
        }
      },
      updateComment: async (commentId: string, data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          await updateInitiativeComment(workspaceSlug, initiativeId, commentId, data);
          setToast({
            title: t("toast.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.update.success"),
          });
        } catch (error) {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.update.error"),
          });
        }
      },
      removeComment: async (commentId: string) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          await deleteInitiativeComment(workspaceSlug, initiativeId, commentId);
          setToast({
            title: t("toast.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.remove.success"),
          });
        } catch (error) {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.remove.error"),
          });
        }
      },
      uploadCommentAsset: async (blockId: string, file: File, commentId?: string): Promise<TFileSignedURLResponse> => {
        try {
          if (!workspaceSlug) throw new Error("Missing fields");
          const res = await uploadEditorAsset({
            blockId,
            data: {
              entity_identifier: commentId ?? "",
              entity_type: EFileAssetType.INITIATIVE_COMMENT_DESCRIPTION,
            },
            file,
            workspaceSlug,
          });
          return res;
        } catch (error) {
          console.log("Error in uploading comment asset:", error);
          throw new Error("Asset upload failed. Please try again later.");
        }
      },
      addCommentReaction: async (commentId: string, reactionEmoji: string) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          await addCommentReaction(workspaceSlug, initiativeId, commentId, { reaction: reactionEmoji });
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
      deleteCommentReaction: async (commentId: string, reactionEmoji: string) => {
        try {
          if (!workspaceSlug || !initiativeId || !currentUser?.id) throw new Error("Missing fields");

          await deleteCommentReaction(workspaceSlug, initiativeId, commentId, currentUser.id, reactionEmoji);
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
      react: async (commentId: string, reactionEmoji: string, userReactions: string[]) => {
        if (userReactions.includes(reactionEmoji)) await ops.deleteCommentReaction(commentId, reactionEmoji);
        else await ops.addCommentReaction(commentId, reactionEmoji);
      },
      reactionIds: (commentId: string) => getCommentReactionsByCommentId(commentId),
      userReactions: (commentId: string) =>
        currentUser && commentReactionsByUser(commentId, currentUser?.id).map((r) => r.reaction),
      getReactionUsers: (reaction: string, reactionIds: Record<string, string[]>): string => {
        const reactionUsers = (reactionIds?.[reaction] || [])
          .map((reactionId) => {
            const reactionDetails = getCommentReactionById(reactionId);
            return reactionDetails ? getUserDetails(reactionDetails.actor)?.display_name : null;
          })
          .filter((displayName): displayName is string => !!displayName);
        const formattedUsers = formatTextList(reactionUsers);
        return formattedUsers;
      },
    };

    return ops;
  }, [
    workspaceSlug,
    initiativeId,
    currentUser?.id,
    createInitiativeComment,
    updateInitiativeComment,
    deleteInitiativeComment,
    addCommentReaction,
    deleteCommentReaction,
    uploadEditorAsset,
  ]);

  return operations;
};
