"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// Plane
import { TFileSignedURLResponse } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
import { setToast, TOAST_TYPE } from "@plane/ui";
// Plane-web
import { EActivityFilterType, filterActivityOnSelectedFilters } from "@/plane-web/constants";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeActivityComment, TInitiativeComment } from "@/plane-web/types/initiative";
// services
import { FileService } from "@/services/file.service";
import { InitiativeCommentCard } from "./comment-card";
import { InitiativeCommentCreate } from "./comment-create";

const fileService = new FileService();

type TInitiativeSidebarCommentsRootProps = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export type TInitiativeActivityOperations = {
  createComment: (data: Partial<TInitiativeComment>) => Promise<TInitiativeComment | undefined>;
  updateComment: (commentId: string, data: Partial<TInitiativeComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  uploadCommentAsset: (file: File, commentId?: string) => Promise<TFileSignedURLResponse>;
};

export const InitiativeSidebarCommentsRoot: FC<TInitiativeSidebarCommentsRootProps> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // hooks
  const {
    initiative: {
      initiativeCommentActivities: {
        getActivityCommentByIssueId,
        createInitiativeComment,
        updateInitiativeComment,
        deleteInitiativeComment,
      },
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

  const activityComments = getActivityCommentByIssueId(initiativeId);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, [EActivityFilterType.COMMENT]);

  return (
    <div className="space-y-5 min-h-[200px] w-full">
      {!disabled && (
        <InitiativeCommentCreate
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          activityOperations={activityOperations}
        />
      )}
      {filteredActivityComments.map((activityComment) => {
        const currActivityComment = activityComment as TInitiativeActivityComment;

        return currActivityComment.activity_type === "COMMENT" ? (
          <InitiativeCommentCard
            key={currActivityComment.id}
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            comment={currActivityComment.detail as TInitiativeComment}
            activityOperations={activityOperations}
            disabled={disabled}
          />
        ) : (
          <></>
        );
      })}
    </div>
  );
});
