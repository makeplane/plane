import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { AddComment, IssueActivitySection } from "components/issues";
// services
import { IssueService, IssueCommentService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
// types
import { IIssue, IIssueActivity } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = { issueDetails: IIssue };

// services
const issueService = new IssueService();
const issueCommentService = new IssueCommentService();

export const InboxIssueActivity: React.FC<Props> = observer(({ issueDetails }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    user: userStore,
    trackEvent: { postHogEventTracker },
    workspace: { currentWorkspace },
  } = useMobxStore();

  const { setToastAlert } = useToast();

  const { data: issueActivity, mutate: mutateIssueActivity } = useSWR(
    workspaceSlug && projectId && issueDetails ? PROJECT_ISSUES_ACTIVITY(issueDetails.id) : null,
    workspaceSlug && projectId && issueDetails
      ? () => issueService.getIssueActivities(workspaceSlug.toString(), projectId.toString(), issueDetails.id)
      : null
  );

  const user = userStore.currentUser;

  const handleCommentUpdate = async (commentId: string, data: Partial<any>) => {
    if (!workspaceSlug || !projectId || !issueDetails.id || !user) return;

    await issueCommentService
      .patchIssueComment(workspaceSlug as string, projectId as string, issueDetails.id as string, commentId, data)
      .then((res) => {
        mutateIssueActivity();
        postHogEventTracker(
          "COMMENT_UPDATED",
          {
            ...res,
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
      });
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !issueDetails.id || !user) return;

    mutateIssueActivity((prevData: any) => prevData?.filter((p: any) => p.id !== commentId), false);

    await issueCommentService
      .deleteIssueComment(workspaceSlug as string, projectId as string, issueDetails.id as string, commentId)
      .then(() => {
        mutateIssueActivity();
        postHogEventTracker(
          "COMMENT_DELETED",
          {
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
      });
  };

  const handleAddComment = async (formData: IIssueActivity) => {
    if (!workspaceSlug || !issueDetails || !user) return;

    await issueCommentService
      .createIssueComment(workspaceSlug.toString(), issueDetails.project, issueDetails.id, formData)
      .then((res) => {
        mutate(PROJECT_ISSUES_ACTIVITY(issueDetails.id));
        postHogEventTracker(
          "COMMENT_ADDED",
          {
            ...res,
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Comment could not be posted. Please try again.",
        })
      );
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg text-custom-text-100">Comments/Activity</h3>
      <IssueActivitySection
        activity={issueActivity}
        handleCommentUpdate={handleCommentUpdate}
        handleCommentDelete={handleCommentDelete}
      />
      <AddComment onSubmit={handleAddComment} />
    </div>
  );
});
