import { useMemo } from "react";
import { useTranslation } from "@plane/i18n";
import { TCommentsOperations, TIssueActivity, TIssueComment } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { formatTextList } from "@plane/utils";
import { useEditorAsset, useIssueDetail, useMember, useUser } from "@/hooks/store";

export const useCommentOperations = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  issueId: string | undefined
): TCommentsOperations => {
  // store hooks
  const {
    commentReaction: { getCommentReactionsByCommentId, commentReactionsByUser, getCommentReactionById },
    createComment,
    updateComment,
    removeComment,
    createCommentReaction,
    removeCommentReaction,
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { uploadEditorAsset } = useEditorAsset();
  const { data: currentUser } = useUser();
  const { t } = useTranslation();

  const operations = useMemo(() => {
    // Define operations object with all methods
    const ops = {
      createComment: async (data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          const comment = await createComment(workspaceSlug, projectId, issueId, data);
          setToast({
            title: t("common.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.create.success"),
          });
          return comment;
        } catch {
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.create.error"),
          });
        }
      },
      updateComment: async (commentId: string, data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await updateComment(workspaceSlug, projectId, issueId, commentId, data);
          setToast({
            title: t("common.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.update.success"),
          });
        } catch {
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.update.error"),
          });
        }
      },
      removeComment: async (commentId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await removeComment(workspaceSlug, projectId, issueId, commentId);
          setToast({
            title: t("common.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.remove.success"),
          });
        } catch {
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.remove.error"),
          });
        }
      },
      uploadCommentAsset: async (blockId: string, file: File, commentId?: string) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing fields");
          const res = await uploadEditorAsset({
            blockId,
            data: {
              entity_identifier: commentId ?? "",
              entity_type: EFileAssetType.COMMENT_DESCRIPTION,
            },
            file,
            projectId,
            workspaceSlug,
          });
          return res;
        } catch (error) {
          console.log("Error in uploading comment asset:", error);
          throw new Error(t("issue.comments.upload.error"));
        }
      },
      addCommentReaction: async (commentId: string, reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !commentId) throw new Error("Missing fields");
          await createCommentReaction(workspaceSlug, projectId, commentId, reaction);
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
      deleteCommentReaction: async (commentId: string, reaction: string) => {
        try {
          if (!workspaceSlug || !projectId || !commentId || !currentUser?.id) throw new Error("Missing fields");
          removeCommentReaction(workspaceSlug, projectId, commentId, reaction, currentUser.id);
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
        currentUser ? commentReactionsByUser(commentId, currentUser?.id).map((r) => r.reaction) : [],
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
  }, [workspaceSlug, projectId, issueId, createComment, updateComment, uploadEditorAsset, removeComment]);

  return operations;
};
