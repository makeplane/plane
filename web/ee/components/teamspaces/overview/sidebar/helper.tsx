import { useMemo } from "react";
import { TCommentsOperations, TFileSignedURLResponse, TIssueComment } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { formatTextList  } from "@plane/utils";
import { useEditorAsset, useMember, useUser } from "@/hooks/store";
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
  const { uploadEditorAsset } = useEditorAsset();
  const { data: currentUser } = useUser();

  const operations = useMemo(() => {
    // Define operations object with all methods
    const ops = {
      createComment: async (data: Partial<TIssueComment>) => {
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
      updateComment: async (commentId: string, data: Partial<TIssueComment>) => {
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
      removeComment: async (commentId: string) => {
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
      uploadCommentAsset: async (blockId: string, file: File, commentId?: string): Promise<TFileSignedURLResponse> => {
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
          throw new Error("Asset upload failed. Please try again later.");
        }
      },
      addCommentReaction: async (commentId: string, reactionEmoji: string) => {
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
      deleteCommentReaction: async (commentId: string, reactionEmoji: string) => {
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
    teamspaceId,
    createTeamspaceComment,
    updateTeamspaceComment,
    uploadEditorAsset,
    deleteTeamspaceComment,
  ]);

  return operations;
};
