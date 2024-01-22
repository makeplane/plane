import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { History, LucideIcon, MessageSquare, Network } from "lucide-react";
// hooks
import { useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { IssueActivityCommentRoot, IssueActivityRoot, IssueCommentRoot, IssueCommentCreateUpdate } from ".";

type TIssueActivity = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

type TActivityTabs = "all" | "activity" | "comments";

const activityTabs: { key: TActivityTabs; title: string; icon: LucideIcon }[] = [
  {
    key: "all",
    title: "All",
    icon: History,
  },
  {
    key: "activity",
    title: "Activity",
    icon: Network,
  },
  {
    key: "comments",
    title: "Comments",
    icon: MessageSquare,
  },
];

export type TActivityOperations = {
  createComment: (data: any) => Promise<void>;
  updateComment: (commentId: string, data: any) => Promise<void>;
  createCommentReaction: (commentId: string, reaction: string) => Promise<void>;
  removeCommentReaction: (commentId: string, reaction: string) => Promise<void>;
};

export const IssueActivity: FC<TIssueActivity> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // hooks
  const { createComment, updateComment, createCommentReaction, removeCommentReaction } = useIssueDetail();
  const { setToastAlert } = useToast();
  // state
  const [activityTab, setActivityTab] = useState<TActivityTabs>("comments");

  const activityOperations: TActivityOperations = useMemo(
    () => ({
      createComment: async (data: any) => {
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
      updateComment: async (commentId: string, data: any) => {
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
      createCommentReaction: async (commentId: string, reaction: string) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing fields");
          await createCommentReaction(workspaceSlug, projectId, commentId, reaction);
          setToastAlert({
            title: "Comment reaction added successfully.",
            type: "success",
            message: "Comment reaction added successfully.",
          });
        } catch (error) {
          setToastAlert({
            title: "Comment reaction addition failed.",
            type: "error",
            message: "Comment reaction addition failed. Please try again later.",
          });
        }
      },
      removeCommentReaction: async (commentId: string, reaction: string) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing fields");
          await removeCommentReaction(workspaceSlug, projectId, commentId, reaction);
          setToastAlert({
            title: "Comment reaction removed successfully.",
            type: "success",
            message: "Comment reaction removed successfully.",
          });
        } catch (error) {
          setToastAlert({
            title: "Comment reaction removal failed.",
            type: "error",
            message: "Comment reaction removal failed. Please try again later.",
          });
        }
      },
    }),
    [
      workspaceSlug,
      projectId,
      issueId,
      createComment,
      updateComment,
      createCommentReaction,
      removeCommentReaction,
      setToastAlert,
    ]
  );

  const componentCommonProps = {
    workspaceSlug,
    projectId,
    issueId,
    disabled,
  };

  return (
    <div className="space-y-3 pt-3">
      {/* header */}
      <div className="text-lg text-custom-text-100">Comments/Activity</div>

      {/* rendering activity */}
      <div className="space-y-2">
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
            <IssueActivityCommentRoot {...componentCommonProps} />
          ) : activityTab === "activity" ? (
            <IssueActivityRoot {...componentCommonProps} />
          ) : (
            <IssueCommentRoot {...componentCommonProps} />
          )}
        </div>
      </div>

      {/* rendering issue comment editor */}
      <IssueCommentCreateUpdate activityOperations={activityOperations} />
    </div>
  );
});
