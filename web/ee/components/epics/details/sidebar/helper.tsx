import { useMemo } from "react";
// plane imports
import { EFileAssetType, EIssueServiceType, TCommentsOperations, TIssueComment } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { formatTextList } from "@plane/utils";
// hooks
import { useEditorAsset, useIssueDetail, useMember, useUser } from "@/hooks/store";

export const useCommentOperations = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  epicId: string | undefined
): TCommentsOperations => {
  // store hooks
  const {
    commentReaction: { getCommentReactionsByCommentId, commentReactionsByUser, getCommentReactionById },
    createComment,
    updateComment,
    removeComment,
    createCommentReaction,
    removeCommentReaction,
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { getUserDetails } = useMember();
  const { uploadEditorAsset } = useEditorAsset();
  const { data: currentUser } = useUser();

  const operations = useMemo(() => {
    // Define operations object with all methods
    const ops = {
      createComment: async (data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !projectId || !epicId) throw new Error("Missing fields");
          const comment = await createComment(workspaceSlug, projectId, epicId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment created successfully.",
          });
          return comment;
        } catch (error) {
          console.log("Error in creating comment:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment creation failed. Please try again later.",
          });
        }
      },
      updateComment: async (commentId: string, data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !projectId || !epicId) throw new Error("Missing fields");
          await updateComment(workspaceSlug, projectId, epicId, commentId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment updated successfully.",
          });
        } catch (error) {
          console.log("Error in updating comment:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment update failed. Please try again later.",
          });
        }
      },
      removeComment: async (commentId: string) => {
        try {
          if (!workspaceSlug || !projectId || !epicId) throw new Error("Missing fields");
          await removeComment(workspaceSlug, projectId, epicId, commentId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment removed successfully.",
          });
        } catch (error) {
          console.log("Error in removing comment:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment remove failed. Please try again later.",
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
            projectId,
            file,
            workspaceSlug,
          });
          return res;
        } catch (error) {
          console.log("Error in uploading comment asset:", error);
          throw new Error("Asset upload failed. Please try again later.");
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
  }, [workspaceSlug, projectId, epicId, createComment, updateComment, uploadEditorAsset, removeComment]);

  return operations;
};
