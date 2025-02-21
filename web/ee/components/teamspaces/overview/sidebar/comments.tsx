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
// hooks
import { useEditorAsset } from "@/hooks/store";
// plane web imports
import { useTeamspaceUpdates } from "@/plane-web/hooks/store/teamspaces/use-teamspace-updates";
import { TTeamspaceComment } from "@/plane-web/types";
// local components
import { TeamspaceCommentCard } from "./comments/comment-card";
import { TeamspaceCommentCreate } from "./comments/comment-create";

type TTeamSidebarCommentsRootProps = {
  teamspaceId: string;
  isEditingAllowed?: boolean;
};

export type TTeamspaceActivityOperations = {
  createComment: (data: Partial<TTeamspaceComment>) => Promise<TTeamspaceComment | undefined>;
  updateComment: (commentId: string, data: Partial<TTeamspaceComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  uploadCommentAsset: (blockId: string, file: File, commentId?: string) => Promise<TFileSignedURLResponse>;
};

export const TeamsOverviewSidebarComments: FC<TTeamSidebarCommentsRootProps> = observer((props) => {
  const { teamspaceId, isEditingAllowed = true } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // hooks
  const {
    getTeamspaceCommentsLoader,
    getTeamspaceComments,
    getTeamspaceCommentsSortOrder,
    toggleTeamspaceCommentsSortOrder,
    createTeamspaceComment,
    updateTeamspaceComment,
    deleteTeamspaceComment,
  } = useTeamspaceUpdates();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const teamspaceCommentsLoader = getTeamspaceCommentsLoader(teamspaceId);
  const teamspaceComments = getTeamspaceComments(teamspaceId);
  const teamspaceCommentsSortOrder = getTeamspaceCommentsSortOrder();

  const activityOperations: TTeamspaceActivityOperations = useMemo(
    () => ({
      createComment: async (data) => {
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
      updateComment: async (commentId, data) => {
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
      removeComment: async (commentId) => {
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
      uploadCommentAsset: async (blockId, file, commentId) => {
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
    }),
    [
      workspaceSlug,
      teamspaceId,
      createTeamspaceComment,
      updateTeamspaceComment,
      deleteTeamspaceComment,
      uploadEditorAsset,
    ]
  );

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
      <div className="py-2 flex flex-col px-6 gap-4">
        <div className="flex gap-2 items-center justify-between">
          <span className="text-sm font-semibold">Comments</span>
          <span className="flex items-center gap-2">
            {teamspaceCommentsLoader && ["init-loader", "mutation"].includes(teamspaceCommentsLoader) ? (
              <Spinner size={12} className="animate-spin" />
            ) : null}
            <ActivitySortRoot
              sortOrder={teamspaceCommentsSortOrder}
              toggleSort={() => toggleTeamspaceCommentsSortOrder()}
              className="py-1"
              iconClassName="size-3"
            />
          </span>
        </div>
        {isEditingAllowed && (
          <TeamspaceCommentCreate
            workspaceSlug={workspaceSlug}
            teamspaceId={teamspaceId}
            activityOperations={activityOperations}
          />
        )}
      </div>
      <div className="flex-grow px-6 py-4 space-y-5 overflow-y-auto vertical-scrollbar scrollbar-sm">
        {teamspaceComments?.map((comment) => (
          <TeamspaceCommentCard
            key={comment.id}
            workspaceSlug={workspaceSlug}
            teamspaceId={teamspaceId}
            comment={comment}
            activityOperations={activityOperations}
            disabled={!isEditingAllowed}
          />
        ))}
      </div>
    </div>
  );
});
