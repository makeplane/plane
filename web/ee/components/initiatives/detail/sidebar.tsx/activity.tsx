"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// Plane
import { EFileAssetType } from "@plane/types/src/enums";
import { setToast, TOAST_TYPE } from "@plane/ui";
// Plane-web
import { EActivityFilterType } from "@/plane-web/constants";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// Services
import { FileService } from "@/services/file.service";
//
import { InitiativeActivityCommentRoot } from "./activity/activity-comment-root";
import { TInitiativeActivityOperations } from "./comments";

const fileService = new FileService();

type TEpicDetailActivityRootProps = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeDetailsActivityRoot: FC<TEpicDetailActivityRootProps> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // hooks
  const {
    initiative: {
      initiativeCommentActivities: { createInitiativeComment, updateInitiativeComment, deleteInitiativeComment },
    },
  } = useInitiatives();

  const activityOperations: TInitiativeActivityOperations = useMemo(
    () => ({
      createComment: async (data) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          const comment = await createInitiativeComment(workspaceSlug, initiativeId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment created successfully.",
          });
          return comment;
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment creation failed. Please try again later.",
          });
        }
      },
      updateComment: async (commentId, data) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          await updateInitiativeComment(workspaceSlug, initiativeId, commentId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment updated successfully.",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment update failed. Please try again later.",
          });
        }
      },
      removeComment: async (commentId) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing fields");
          await deleteInitiativeComment(workspaceSlug, initiativeId, commentId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment removed successfully.",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment remove failed. Please try again later.",
          });
        }
      },
      uploadCommentAsset: async (file, commentId) => {
        try {
          if (!workspaceSlug || !commentId) throw new Error("Missing fields");
          const res = await fileService.uploadWorkspaceAsset(
            workspaceSlug,
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
    [workspaceSlug, initiativeId, createInitiativeComment, updateInitiativeComment, deleteInitiativeComment]
  );

  return (
    <div className="flex items-center h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-y -auto overflow-hidden">
      <div className="flex flex-col gap-3 h-full w-full overflow-y-auto">
        <h5 className="text-sm font-medium">Activity</h5>
        <div className="space-y-3">
          <div className="min-h-[200px]">
            <div className="space-y-3">
              <InitiativeActivityCommentRoot
                workspaceSlug={workspaceSlug}
                initiativeId={initiativeId}
                selectedFilters={[EActivityFilterType.ACTIVITY]}
                activityOperations={activityOperations}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
