import { useMemo } from "react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType } from "@plane/types";
import type { TCommentsOperations } from "@plane/types";
import { copyUrlToClipboard, formatTextList, generateWorkItemLink } from "@plane/utils";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";

export const useWorkItemCommentOperations = (
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
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  const { data: currentUser } = useUser();
  // derived values
  const issueDetails = issueId ? getIssueById(issueId) : undefined;
  const projectDetails = projectId ? getProjectById(projectId) : undefined;
  // translation
  const { t } = useTranslation();

  const operations: TCommentsOperations = useMemo(() => {
    // Define operations object with all methods
    const ops: TCommentsOperations = {
      copyCommentLink: (id) => {
        if (!workspaceSlug || !issueDetails) return;
        try {
          const workItemLink = generateWorkItemLink({
            workspaceSlug,
            projectId: issueDetails.project_id,
            issueId,
            projectIdentifier: projectDetails?.identifier,
            sequenceId: issueDetails.sequence_id,
          });
          const commentLink = `${workItemLink}#comment-${id}`;
          copyUrlToClipboard(commentLink).then(() => {
            setToast({
              title: t("common.success"),
              type: TOAST_TYPE.SUCCESS,
              message: t("issue.comments.copy_link.success"),
            });
          });
        } catch (error) {
          console.error("Error in copying comment link:", error);
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.copy_link.error"),
          });
        }
      },
      createComment: async (data) => {
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
      updateComment: async (commentId, data) => {
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
      removeComment: async (commentId) => {
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
      uploadCommentAsset: async (blockId, file, commentId) => {
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
      duplicateCommentAsset: async (assetId, commentId) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing fields");
          const res = await duplicateEditorAsset({
            assetId,
            entityId: commentId || undefined,
            entityType: EFileAssetType.COMMENT_DESCRIPTION,
            projectId,
            workspaceSlug,
          });
          return res;
        } catch {
          throw new Error("Asset duplication failed. Please try again later.");
        }
      },
      addCommentReaction: async (commentId, reaction) => {
        try {
          if (!workspaceSlug || !projectId || !commentId) throw new Error("Missing fields");
          await createCommentReaction(workspaceSlug, projectId, commentId, reaction);
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
      deleteCommentReaction: async (commentId, reaction) => {
        try {
          if (!workspaceSlug || !projectId || !commentId || !currentUser?.id) throw new Error("Missing fields");
          removeCommentReaction(workspaceSlug, projectId, commentId, reaction, currentUser.id);
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
        if (userReactions.includes(reactionEmoji)) await ops.deleteCommentReaction(commentId, reactionEmoji);
        else await ops.addCommentReaction(commentId, reactionEmoji);
      },
      reactionIds: (commentId) => getCommentReactionsByCommentId(commentId),
      userReactions: (commentId) =>
        currentUser ? commentReactionsByUser(commentId, currentUser?.id).map((r) => r.reaction) : [],
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
    };
    return ops;
  }, [workspaceSlug, projectId, issueId, createComment, updateComment, uploadEditorAsset, removeComment]);

  return operations;
};
