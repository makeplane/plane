import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { History, LucideIcon, MessageCircle, ListRestart } from "lucide-react";
// hooks
import { useIssueDetail, useProject } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { IssueActivityCommentRoot, IssueActivityRoot, IssueCommentRoot, IssueCommentCreate } from "./";
// types
import { TIssueComment } from "@plane/types";

type TIssueActivity = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

type TActivityTabs = "all" | "activity" | "comments";

const activityTabs: { key: TActivityTabs; title: string; icon: LucideIcon }[] = [
  {
    key: "all",
    title: "All Activity",
    icon: History,
  },
  {
    key: "activity",
    title: "Updates",
    icon: ListRestart,
  },
  {
    key: "comments",
    title: "Comments",
    icon: MessageCircle,
  },
];

export type TActivityOperations = {
  createComment: (data: Partial<TIssueComment>) => Promise<void>;
  updateComment: (commentId: string, data: Partial<TIssueComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
};

export const IssueActivity: FC<TIssueActivity> = observer((props) => {
  const { workspaceSlug, projectId, issueId } = props;
  // hooks
  const { createComment, updateComment, removeComment } = useIssueDetail();
  const { setToastAlert } = useToast();
  const { getProjectById } = useProject();
  // state
  const [activityTab, setActivityTab] = useState<TActivityTabs>("all");

  const activityOperations: TActivityOperations = useMemo(
    () => ({
      createComment: async (data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await createComment(workspaceSlug, projectId, issueId, data);
          setToastAlert({
            title: "Comment created successfully.",
            type: "success",
            message: "Comment created successfully.",
          });
        } catch (error) {
          setToastAlert({
            title: "Comment creation failed.",
            type: "error",
            message: "Comment creation failed. Please try again later.",
          });
        }
      },
      updateComment: async (commentId: string, data: Partial<TIssueComment>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await updateComment(workspaceSlug, projectId, issueId, commentId, data);
          setToastAlert({
            title: "Comment updated successfully.",
            type: "success",
            message: "Comment updated successfully.",
          });
        } catch (error) {
          setToastAlert({
            title: "Comment update failed.",
            type: "error",
            message: "Comment update failed. Please try again later.",
          });
        }
      },
      removeComment: async (commentId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing fields");
          await removeComment(workspaceSlug, projectId, issueId, commentId);
          setToastAlert({
            title: "Comment removed successfully.",
            type: "success",
            message: "Comment removed successfully.",
          });
        } catch (error) {
          setToastAlert({
            title: "Comment remove failed.",
            type: "error",
            message: "Comment remove failed. Please try again later.",
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, createComment, updateComment, removeComment, setToastAlert]
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
                workspaceSlug={workspaceSlug}
                issueId={issueId}
                activityOperations={activityOperations}
                showAccessSpecifier={project.is_deployed}
              />
              <IssueCommentCreate
                workspaceSlug={workspaceSlug}
                activityOperations={activityOperations}
                showAccessSpecifier={project.is_deployed}
              />
            </div>
          ) : activityTab === "activity" ? (
            <IssueActivityRoot issueId={issueId} />
          ) : (
            <div className="space-y-3">
              <IssueCommentRoot
                workspaceSlug={workspaceSlug}
                issueId={issueId}
                activityOperations={activityOperations}
                showAccessSpecifier={project.is_deployed}
              />
              <IssueCommentCreate
                workspaceSlug={workspaceSlug}
                activityOperations={activityOperations}
                showAccessSpecifier={project.is_deployed}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
