import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// components
import { AddComment, IssueActivitySection } from "components/issues";
// services
import { IssueService, IssueCommentService } from "services/issue";
// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// types
import { IIssue, IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = { issueDetails: IIssue };

// services
const issueService = new IssueService();
const issueCommentService = new IssueCommentService();

export const InboxIssueActivity: React.FC<Props> = ({ issueDetails }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { data: issueActivity, mutate: mutateIssueActivity } = useSWR(
    workspaceSlug && projectId && inboxIssueId ? PROJECT_ISSUES_ACTIVITY(inboxIssueId.toString()) : null,
    workspaceSlug && projectId && inboxIssueId
      ? () => issueService.getIssueActivities(workspaceSlug.toString(), projectId.toString(), inboxIssueId.toString())
      : null
  );

  const handleCommentUpdate = async (commentId: string, data: Partial<IIssueComment>) => {
    if (!workspaceSlug || !projectId || !inboxIssueId) return;

    await issueCommentService
      .patchIssueComment(workspaceSlug as string, projectId as string, inboxIssueId as string, commentId, data, user)
      .then(() => mutateIssueActivity());
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !inboxIssueId) return;

    mutateIssueActivity((prevData: any) => prevData?.filter((p: any) => p.id !== commentId), false);

    await issueCommentService
      .deleteIssueComment(workspaceSlug as string, projectId as string, inboxIssueId as string, commentId, user)
      .then(() => mutateIssueActivity());
  };

  const handleAddComment = async (formData: IIssueComment) => {
    if (!workspaceSlug || !issueDetails) return;

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
};
