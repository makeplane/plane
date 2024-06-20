"use client";

import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { History, LucideIcon, MessageCircle } from "lucide-react";
// types
import { TIssueComment } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { IssueActivityCommentRoot, IssueCommentRoot, IssueCommentCreate } from "@/components/issues";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";

type TIssueActivity = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

type TActivityTabs = "all" | "comments";

const activityTabs: { key: TActivityTabs; title: string; icon: LucideIcon }[] = [
  {
    key: "comments",
    title: "Comments",
    icon: MessageCircle,
  },
  {
    key: "all",
    title: "All activity",
    icon: History,
  },
];

export type TActivityOperations = {
  createComment: (data: Partial<TIssueComment>) => Promise<void>;
  updateComment: (commentId: string, data: Partial<TIssueComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
};

export const IssueActivity: FC<TIssueActivity> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // hooks
  const { createComment, updateComment, removeComment } = useIssueDetail();
  const { getProjectById } = useProject();
  // state
  const [activityTab, setActivityTab] = useState<TActivityTabs>("comments");

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
    <div className="space-y-3 pt-3">
      {/* header */}
      <div className="text-lg text-custom-text-100">Activity</div>

      {/* rendering activity */}
      <div className="space-y-3">
        <div className="relative flex items-center gap-1">
          {activityTabs.map((tab) => (
            <div
              key={tab.key}
              className={`relative flex items-center px-2 py-1.5 gap-1 cursor-pointer transition-all rounded 
            ${
              tab.key === activityTab
                ? `text-custom-text-100 bg-custom-background-80`
                : `text-custom-text-200 hover:bg-custom-background-80`
            }`}
              onClick={() => setActivityTab(tab.key)}
            >
              <div className="flex-shrink-0 w-4 h-4 flex justify-center items-center">
                <tab.icon className="w-3 h-3" />
              </div>
              <div className="text-sm">{tab.title}</div>
            </div>
          ))}
        </div>

        <div className="min-h-[200px]">
          {activityTab === "all" ? (
            <div className="space-y-3">
              <IssueActivityCommentRoot
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                issueId={issueId}
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
          ) : (
            <div className="space-y-3">
              <IssueCommentRoot
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                issueId={issueId}
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
          )}
        </div>
      </div>
    </div>
  );
});
