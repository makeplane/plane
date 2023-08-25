import useSWR, { mutate } from "swr";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// services
// import issuesService from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// components
// import { AddComment, IssueActivitySection } from "components/issues";
// fetch-keys
// import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = {
  workspaceSlug: string;
  issue: any;
};

export const PeekOverviewIssueActivity: React.FC<Props> = observer(({ workspaceSlug, issue }) => {
  const { setToastAlert } = useToast();

  const { user: userStore } = useMobxStore();

  const user = userStore?.currentUser;

  // const { data: issueActivity, mutate: mutateIssueActivity } = useSWR(
  //   workspaceSlug && issue ? PROJECT_ISSUES_ACTIVITY(issue.id) : null,
  //   workspaceSlug && issue
  //     ? () => issuesService.getIssueActivities(workspaceSlug.toString(), issue?.project, issue?.id)
  //     : null
  // );

  // const handleCommentUpdate = async (comment: any) => {
  //   if (!workspaceSlug || !issue) return;

  //   await issuesService
  //     .patchIssueComment(
  //       workspaceSlug as string,
  //       issue.project,
  //       issue.id,
  //       comment.id,
  //       comment,
  //       user
  //     )
  //     .then(() => mutateIssueActivity());
  // };

  // const handleCommentDelete = async (commentId: string) => {
  //   if (!workspaceSlug || !issue) return;

  //   mutateIssueActivity((prevData: any) => prevData?.filter((p: any) => p.id !== commentId), false);

  //   await issuesService
  //     .deleteIssueComment(workspaceSlug as string, issue.project, issue.id, commentId, user)
  //     .then(() => mutateIssueActivity());
  // };

  // const handleAddComment = async (formData: IIssueComment) => {
  //   if (!workspaceSlug || !issue) return;

  //   await issuesService
  //     .createIssueComment(workspaceSlug.toString(), issue.project, issue.id, formData, user)
  //     .then(() => {
  //       mutate(PROJECT_ISSUES_ACTIVITY(issue.id));
  //     })
  //     .catch(() =>
  //       setToastAlert({
  //         type: "error",
  //         title: "Error!",
  //         message: "Comment could not be posted. Please try again.",
  //       })
  //     );
  // };

  return (
    <div>
      <h4 className="font-medium">Activity</h4>
      {/* <div className="mt-4">
        <IssueActivitySection
          activity={issueActivity}
          handleCommentUpdate={handleCommentUpdate}
          handleCommentDelete={handleCommentDelete}
        />
        <div className="mt-4">
          <AddComment onSubmit={handleAddComment} />
        </div>
      </div> */}
    </div>
  );
});
