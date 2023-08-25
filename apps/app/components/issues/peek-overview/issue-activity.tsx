import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// components
import { IssueActivitySection } from "components/issues";
// types
import { IIssue, IIssueComment } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
import useUser from "hooks/use-user";

type Props = {
  workspaceSlug: string;
  issue: IIssue;
  readOnly: boolean;
};

export const PeekOverviewIssueActivity: React.FC<Props> = ({ workspaceSlug, issue, readOnly }) => {
  const { user } = useUser();

  const { data: issueActivity, mutate: mutateIssueActivity } = useSWR(
    workspaceSlug && issue ? PROJECT_ISSUES_ACTIVITY(issue.id) : null,
    workspaceSlug && issue
      ? () => issuesService.getIssueActivities(workspaceSlug.toString(), issue?.project, issue?.id)
      : null
  );

  const handleCommentUpdate = async (comment: IIssueComment) => {
    if (!workspaceSlug || !issue) return;

    await issuesService
      .patchIssueComment(
        workspaceSlug as string,
        issue.project,
        issue.id,
        comment.id,
        comment,
        user
      )
      .then(() => mutateIssueActivity());
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !issue) return;

    mutateIssueActivity((prevData: any) => prevData?.filter((p: any) => p.id !== commentId), false);

    await issuesService
      .deleteIssueComment(workspaceSlug as string, issue.project, issue.id, commentId, user)
      .then(() => mutateIssueActivity());
  };

  return (
    <div>
      <h4 className="font-medium">Activity</h4>
      <div className="mt-4">
        <IssueActivitySection
          activity={issueActivity}
          handleCommentUpdate={handleCommentUpdate}
          handleCommentDelete={handleCommentDelete}
        />
      </div>
    </div>
  );
};
