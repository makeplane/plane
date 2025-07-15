import { useMemo } from "react";
import { TEAMSPACE_UPDATES_TRACKER_ELEMENTS, TEAMSPACE_UPDATES_TRACKER_EVENTS } from "@plane/constants";
import { EFileAssetType, TCommentsOperations, TFileSignedURLResponse } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { formatTextList } from "@plane/utils";
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";
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

  // Helper function to capture events with consistent element
  const captureTeamspaceCommentEvent = (
    eventName: string,
    state: "SUCCESS" | "ERROR",
    payload?: Record<string, any>
  ) => {
    captureElementAndEvent({
      element: {
        elementName: TEAMSPACE_UPDATES_TRACKER_ELEMENTS.SIDEBAR_COMMENT_SECTION,
      },
      event: {
        eventName,
        payload,
        state,
      },
    });
  };

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
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_CREATED, "SUCCESS", { id: comment.id });
          return comment;
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment creation failed. Please try again later.",
          });
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_CREATED, "ERROR");
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
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_UPDATED, "SUCCESS", { id: commentId });
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment update failed. Please try again later.",
          });
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_UPDATED, "ERROR", { id: commentId });
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
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_DELETED, "SUCCESS", { id: commentId });
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment remove failed. Please try again later.",
          });
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_DELETED, "ERROR", { id: commentId });
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
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_ASSET_UPLOADED, "SUCCESS", {
            id: commentId,
          });
          return res;
        } catch (error) {
          console.log("Error in uploading comment asset:", error);
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_ASSET_UPLOADED, "ERROR", {
            id: commentId,
          });
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
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_REACTION_ADDED, "SUCCESS", {
            id: commentId,
          });
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Reaction creation failed",
          });
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_REACTION_ADDED, "ERROR", {
            id: commentId,
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
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_REACTION_REMOVED, "SUCCESS", {
            id: commentId,
          });
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Reaction remove failed",
          });
          captureTeamspaceCommentEvent(TEAMSPACE_UPDATES_TRACKER_EVENTS.COMMENT_REACTION_REMOVED, "ERROR", {
            id: commentId,
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
