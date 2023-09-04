import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// components
import { AddComment, IssueActivitySection } from "components/issues";
// services
import issuesService from "services/issues.service";
// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// types
import { IIssue, IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = { issueDetails: IIssue };

export const InboxIssueActivity: React.FC<Props> = ({ issueDetails }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { data: issueActivity, mutate: mutateIssueActivity } = useSWR(
    workspaceSlug && projectId && inboxIssueId
      ? PROJECT_ISSUES_ACTIVITY(inboxIssueId.toString())
      : null,
    workspaceSlug && projectId && inboxIssueId
      ? () =>
          issuesService.getIssueActivities(
            workspaceSlug.toString(),
            projectId.toString(),
            inboxIssueId.toString()
          )
      : null
  );

  const handleCommentUpdate = async (comment: IIssueComment) => {
    if (!workspaceSlug || !projectId || !inboxIssueId) return;

    await issuesService
      .patchIssueComment(
        workspaceSlug as string,
        projectId as string,
        inboxIssueId as string,
        comment.id,
        comment,
        user
      )
      .then(() => mutateIssueActivity());
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !inboxIssueId) return;

    mutateIssueActivity((prevData: any) => prevData?.filter((p: any) => p.id !== commentId), false);

    await issuesService
      .deleteIssueComment(
        workspaceSlug as string,
        projectId as string,
        inboxIssueId as string,
        commentId,
        user
      )
      .then(() => mutateIssueActivity());
  };

  const handleAddComment = async (formData: IIssueComment) => {
    if (!workspaceSlug || !issueDetails) return;

    await issuesService
      .createIssueComment(
        workspaceSlug.toString(),
        issueDetails.project,
        issueDetails.id,
        formData,
        user
      )
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
