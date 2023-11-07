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
import { IIssue, IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = { issueDetails: IIssue };

// services
const issueService = new IssueService();
const issueCommentService = new IssueCommentService();

export const InboxIssueActivity: React.FC<Props> = observer(({ issueDetails }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;

  const { user: userStore } = useMobxStore();

  const { setToastAlert } = useToast();

  const { data: issueActivity, mutate: mutateIssueActivity } = useSWR(
    workspaceSlug && projectId && issueDetails ? PROJECT_ISSUES_ACTIVITY(issueDetails.id) : null,
    workspaceSlug && projectId && issueDetails
      ? () => issueService.getIssueActivities(workspaceSlug.toString(), projectId.toString(), issueDetails.id)
      : null
  );

  const user = userStore.currentUser;

  const handleCommentUpdate = async (commentId: string, data: Partial<IIssueComment>) => {
    if (!workspaceSlug || !projectId || !inboxIssueId || !user) return;

    await issueCommentService
      .patchIssueComment(workspaceSlug as string, projectId as string, inboxIssueId as string, commentId, data, user)
      .then(() => mutateIssueActivity());
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !inboxIssueId || !user) return;

    mutateIssueActivity((prevData: any) => prevData?.filter((p: any) => p.id !== commentId), false);

    await issueCommentService
      .deleteIssueComment(workspaceSlug as string, projectId as string, inboxIssueId as string, commentId, user)
      .then(() => mutateIssueActivity());
  };

  const handleAddComment = async (formData: IIssueComment) => {
    if (!workspaceSlug || !issueDetails || !user) return;

    await issueCommentService
      .createIssueComment(workspaceSlug.toString(), issueDetails.project, issueDetails.id, formData, user)
      .then(() => {
        mutate(PROJECT_ISSUES_ACTIVITY(issueDetails.id));
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
