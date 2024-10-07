"use client";

import { FC, Fragment, useMemo, useState } from "react";
import { observer } from "mobx-react";
// types
import { TIssueComment } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { IssueCommentCreate } from "@/components/issues";
import { IssueActivityCommentRoot } from "@/components/issues/issue-detail";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
// plane web components
import { ActivityFilterRoot, IssueActivityWorklogCreateButton } from "@/plane-web/components/issues/worklog";
// plane web constants
import { TActivityFilters, defaultActivityFilters } from "@/plane-web/constants/issues";

type TIssueActivity = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  isIntakeIssue?: boolean;
};

export type TActivityOperations = {
  createComment: (data: Partial<TIssueComment>) => Promise<void>;
  updateComment: (commentId: string, data: Partial<TIssueComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
};

export const IssueActivity: FC<TIssueActivity> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false, isIntakeIssue = false } = props;
  // hooks
  const { createComment, updateComment, removeComment } = useIssueDetail();
  const { getProjectById } = useProject();
  // state
  const [selectedFilters, setSelectedFilters] = useState<TActivityFilters[]>(defaultActivityFilters);
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
      createComment: async (data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await createComment(workspaceSlug, projectId, issueId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment created successfully.",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment creation failed. Please try again later.",
          });
        }
      },
      updateComment: async (commentId: string, data: Partial<TIssueComment>) => {
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
      removeComment: async (commentId: string) => {
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
          {!isIntakeIssue && (
            <IssueActivityWorklogCreateButton
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={disabled}
            />
          )}
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
