"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { TFileSignedURLResponse } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ActivitySortRoot } from "@/components/issues";
// constants
import { TSORT_ORDER } from "@/constants/common";
// plane web imports
import { useTeamUpdates } from "@/plane-web/hooks/store/teams/use-team-updates";
import { TTeamComment } from "@/plane-web/types";
// services
import { FileService } from "@/services/file.service";
// local components
import { TeamCommentCard } from "./comments/comment-card";
import { TeamCommentCreate } from "./comments/comment-create";

const fileService = new FileService();

type TTeamSidebarCommentsRootProps = {
  teamId: string;
  isEditingAllowed?: boolean;
};

export type TTeamActivityOperations = {
  createComment: (data: Partial<TTeamComment>) => Promise<TTeamComment | undefined>;
  updateComment: (commentId: string, data: Partial<TTeamComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  uploadCommentAsset: (file: File, commentId?: string) => Promise<TFileSignedURLResponse>;
};

export const TeamsOverviewSidebarComments: FC<TTeamSidebarCommentsRootProps> = observer((props) => {
  const { teamId, isEditingAllowed = true } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // hooks
  const {
    getTeamCommentsLoader,
    getTeamComments,
    getTeamCommentsSortOrder,
    toggleTeamCommentsSortOrder,
    createTeamComment,
    updateTeamComment,
    deleteTeamComment,
  } = useTeamUpdates();
  // derived values
  const teamCommentsLoader = getTeamCommentsLoader(teamId);
  const teamComments = getTeamComments(teamId);
  const teamCommentsSortOrder = getTeamCommentsSortOrder(teamId);

  const activityOperations: TTeamActivityOperations = useMemo(
    () => ({
      createComment: async (data) => {
        try {
          if (!workspaceSlug || !teamId) throw new Error("Missing fields");
          const comment = await createTeamComment(workspaceSlug, teamId, data);
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
          if (!workspaceSlug || !teamId) throw new Error("Missing fields");
          await updateTeamComment(workspaceSlug, teamId, commentId, data);
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
          if (!workspaceSlug || !teamId) throw new Error("Missing fields");
          await deleteTeamComment(workspaceSlug, teamId, commentId);
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
      uploadCommentAsset: async (file, commentId) => {
        try {
          if (!workspaceSlug) throw new Error("Missing fields");
          const res = await fileService.uploadWorkspaceAsset(
            workspaceSlug,
            {
              entity_identifier: commentId ?? "",
              entity_type: EFileAssetType.TEAM_SPACE_COMMENT_DESCRIPTION,
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
    [workspaceSlug, teamId, createTeamComment, updateTeamComment, deleteTeamComment]
  );

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
      <div className="py-2 flex flex-col px-6 gap-4">
        <div className="flex gap-2 items-center justify-between">
          <span className="text-sm font-semibold">Comments</span>
          <span className="flex items-center gap-2">
            {teamCommentsLoader && ["init-loader", "mutation"].includes(teamCommentsLoader) ? (
              <Spinner size={12} className="animate-spin" />
            ) : null}
            <ActivitySortRoot
              sortOrder={teamCommentsSortOrder as TSORT_ORDER} //TODO: fix this by changing store types.
              toggleSort={() => toggleTeamCommentsSortOrder(teamId)}
              className="py-1"
              iconClassName="size-3"
            />
          </span>
        </div>
        {isEditingAllowed && (
          <TeamCommentCreate workspaceSlug={workspaceSlug} teamId={teamId} activityOperations={activityOperations} />
        )}
      </div>
      <div className="flex-grow px-6 py-4 space-y-5 overflow-y-auto vertical-scrollbar scrollbar-sm">
        {teamComments?.map((comment) => (
          <TeamCommentCard
            key={comment.id}
            workspaceSlug={workspaceSlug}
            teamId={teamId}
            comment={comment}
            activityOperations={activityOperations}
            disabled={!isEditingAllowed}
          />
        ))}
      </div>
    </div>
  );
});
