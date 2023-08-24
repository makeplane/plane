import { useRouter } from "next/router";

import useSWR from "swr";

// components
import { AddComment, IssueActivitySection } from "components/issues";
// services
import issuesService from "services/issues.service";
// hooks
import useUser from "hooks/use-user";
// types
import { IIssue, IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = { issueDetails: IIssue };

export const InboxIssueActivity: React.FC<Props> = ({ issueDetails }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;

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

  return (
    <div className="space-y-5">
      <h3 className="text-lg text-custom-text-100">Comments/Activity</h3>
      <IssueActivitySection
        activity={issueActivity}
        handleCommentUpdate={handleCommentUpdate}
        handleCommentDelete={handleCommentDelete}
      />
      <AddComment issueId={issueDetails.id} user={user} />
    </div>
  );
};
