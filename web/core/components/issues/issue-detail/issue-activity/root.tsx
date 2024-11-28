"use client";

import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
// types
import { TFileSignedURLResponse, TIssueComment } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { IssueCommentCreate } from "@/components/issues";
import { ActivitySortRoot, IssueActivityCommentRoot } from "@/components/issues/issue-detail";
// hooks
import { useIssueDetail, useProject, useUser, useUserPermissions } from "@/hooks/store";
// plane web components
import { ActivityFilterRoot, IssueActivityWorklogCreateButton } from "@/plane-web/components/issues/worklog";
// plane web constants
import { TActivityFilters, defaultActivityFilters } from "@/plane-web/constants/issues";
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

type TIssueActivity = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  isIntakeIssue?: boolean;
};

export type TActivityOperations = {
  createComment: (data: Partial<TIssueComment>) => Promise<TIssueComment>;
  updateComment: (commentId: string, data: Partial<TIssueComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  uploadCommentAsset: (file: File, commentId?: string) => Promise<TFileSignedURLResponse>;
};

export const IssueActivity: FC<TIssueActivity> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false, isIntakeIssue = false } = props;
  // state
  const [selectedFilters, setSelectedFilters] = useState<TActivityFilters[]>(defaultActivityFilters);
  // hooks
  const {
    issue: { getIssueById },
    activity: { sortOrder, toggleSortOrder },
    createComment,
    updateComment,
    removeComment,
  } = useIssueDetail();
  const { projectPermissionsByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { getProjectById } = useProject();
  const { data: currentUser } = useUser();
  //derived values
  const issue = issueId ? getIssueById(issueId) : undefined;
  const currentUserProjectRole = projectPermissionsByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const isAdmin = (currentUserProjectRole ?? EUserPermissions.GUEST) === EUserPermissions.ADMIN;
  const isGuest = (currentUserProjectRole ?? EUserPermissions.GUEST) === EUserPermissions.GUEST;
  const isAssigned = issue?.assignee_ids && currentUser?.id ? issue?.assignee_ids.includes(currentUser?.id) : false;
  const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && (isAdmin || isAssigned);
  // toggle filter
  const toggleFilter = (filter: TActivityFilters) => {
    setSelectedFilters((prevFilters) => {
      if (prevFilters.includes(filter)) {
        if (prevFilters.length === 1) return prevFilters; // Ensure at least one filter is applied
        return prevFilters.filter((f) => f !== filter);
      } else {
        return [...prevFilters, filter];
      }
    });
  };

  const activityOperations: TActivityOperations = useMemo(
    () => ({
      createComment: async (data) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          const comment = await createComment(workspaceSlug, projectId, issueId, data);
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
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await updateComment(workspaceSlug, projectId, issueId, commentId, data);
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
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await removeComment(workspaceSlug, projectId, issueId, commentId);
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
    [workspaceSlug, projectId, issueId, createComment, updateComment, removeComment]
  );

  const project = getProjectById(projectId);
  if (!project) return <></>;

  return (
    <div className="space-y-4 pt-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="text-lg text-custom-text-100">Activity</div>
        <div className="flex items-center gap-2">
          {isWorklogButtonEnabled && (
            <IssueActivityWorklogCreateButton
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={disabled}
            />
          )}
          <ActivitySortRoot sortOrder={sortOrder} toggleSort={toggleSortOrder} />
          <ActivityFilterRoot
            selectedFilters={selectedFilters}
            toggleFilter={toggleFilter}
            isIntakeIssue={isIntakeIssue}
            projectId={projectId}
          />
        </div>
      </div>

      {/* rendering activity */}
      <div className="space-y-3">
        <div className="min-h-[200px]">
          <div className="space-y-3">
            <IssueActivityCommentRoot
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              issueId={issueId}
              selectedFilters={selectedFilters}
              activityOperations={activityOperations}
              showAccessSpecifier={!!project.anchor}
              disabled={disabled}
            />
            {!disabled && (
              <IssueCommentCreate
                issueId={issueId}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                activityOperations={activityOperations}
                showAccessSpecifier={!!project.anchor}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
