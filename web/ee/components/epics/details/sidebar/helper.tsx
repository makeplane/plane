import { useMemo } from "react";
import { EIssueServiceType } from "@plane/constants";
import { EFileAssetType } from "@plane/types/src/enums";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { TActivityOperations } from "@/components/issues";
import { useIssueDetail } from "@/hooks/store";
import { FileService } from "@/services/file.service";

const fileService = new FileService();

export const useEpicActivityOperations = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  epicId: string | undefined
): TActivityOperations => {
  const { createComment, updateComment, removeComment } = useIssueDetail(EIssueServiceType.EPICS);

  const activityOperations: TActivityOperations = useMemo(
    () => ({
      createComment: async (data) => {
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
      updateComment: async (commentId, data) => {
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
      removeComment: async (commentId) => {
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
      uploadCommentAsset: async (file, commentId) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing fields");
          const res = await fileService.uploadProjectAsset(
            workspaceSlug,
            projectId,
            {
              entity_identifier: commentId ?? "",
              entity_type: EFileAssetType.COMMENT_DESCRIPTION,
            },
            file
          );
          return res;
        } catch (error) {
          console.log("Error in uploading comment asset:", error);
          throw new Error("Asset upload failed. Please try again later.");
        }
      },
    }),
    [workspaceSlug, projectId, epicId, createComment, updateComment, removeComment]
  );

  return activityOperations;
};
