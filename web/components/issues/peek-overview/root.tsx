import { FC, Fragment, useEffect, useCallback } from "react";
// router
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useApplication, useIssueDetail, useIssues, useProject, useUser } from "hooks/store";
// components
import { IssueView } from "components/issues";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { TIssue, IIssueLink } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

interface IIssuePeekOverview {
  isArchived?: boolean;
}

export const IssuePeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { isArchived = false } = props;
  // router
  const router = useRouter();
  // hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();
  const { issueId } = useIssueDetail();

  if (!workspaceSlug || !projectId || !issueId) return <></>;

  // FIXME
  // store hooks
  // const {
  //   archivedIssueDetail: {
  //     getIssue: getArchivedIssue,
  //     loader: archivedIssueLoader,
  //     fetchPeekIssueDetails: fetchArchivedPeekIssueDetails,
  //   },
  // } = useMobxStore();

  const {
    updateIssue,
    removeIssue,

    createComment,
    updateComment,
    removeComment,

    createCommentReaction,
    removeCommentReaction,

    createReaction,
    removeReaction,

    createSubscription,
    removeSubscription,

    createLink,
    updateLink,
    removeLink,

    issue: { getIssueById, fetchIssue },

    fetchActivities,
  } = useIssueDetail();
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  const { setToastAlert } = useToast();

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(
      `${workspaceSlug}/projects/${projectId}/${isArchived ? "archived-issues" : "issues"}/${issueId}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const redirectToIssueDetail = () => {
    router.push({
      pathname: `/${workspaceSlug}/projects/${projectId}/${isArchived ? "archived-issues" : "issues"}/${issueId}`,
    });
  };

  // const issue = isArchived ? getArchivedIssue : getIssue;
  // const isLoading = isArchived ? archivedIssueLoader : loader;

  const issue = getIssueById(issueId);
  const isLoading = false;

  const issueUpdate = async (_data: Partial<TIssue>) => {
    if (workspaceSlug && projectId && issueId) {
      await updateIssue(workspaceSlug, projectId, issueId, _data);
      fetchActivities(workspaceSlug, projectId, issueId);
    }
  };

  const issueReactionCreate = (reaction: string) => createReaction(workspaceSlug, projectId, issueId, reaction);

  const issueReactionRemove = (reaction: string) => removeReaction(workspaceSlug, projectId, issueId, reaction);

  const issueCommentCreate = (comment: any) => createComment(workspaceSlug, projectId, issueId, comment);

  const issueCommentUpdate = (comment: any) => updateComment(workspaceSlug, projectId, issueId, comment?.id, comment);

  const issueCommentRemove = (commentId: string) => removeComment(workspaceSlug, projectId, issueId, commentId);

  const issueCommentReactionCreate = (commentId: string, reaction: string) =>
    createCommentReaction(workspaceSlug, projectId, commentId, reaction);

  const issueCommentReactionRemove = (commentId: string, reaction: string) =>
    removeCommentReaction(workspaceSlug, projectId, commentId, reaction);

  const issueSubscriptionCreate = () => createSubscription(workspaceSlug, projectId, issueId);

  const issueSubscriptionRemove = () => removeSubscription(workspaceSlug, projectId, issueId);

  const issueLinkCreate = (formData: IIssueLink) => createLink(workspaceSlug, projectId, issueId, formData);

  const issueLinkUpdate = (formData: IIssueLink, linkId: string) =>
    updateLink(workspaceSlug, projectId, issueId, linkId, formData);

  const issueLinkDelete = (linkId: string) => removeLink(workspaceSlug, projectId, issueId, linkId);

  const handleDeleteIssue = async () => {
    if (!issue) return;
    if (isArchived) await removeArchivedIssue(workspaceSlug, projectId, issue?.id);
  };

  const userRole = currentProjectRole ?? EUserProjectRoles.GUEST;

  return (
    <Fragment>
      <IssueView
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        issue={issue}
        isLoading={isLoading}
        isArchived={isArchived}
        handleCopyText={handleCopyText}
        redirectToIssueDetail={redirectToIssueDetail}
        issueUpdate={issueUpdate}
        issueReactionCreate={issueReactionCreate}
        issueReactionRemove={issueReactionRemove}
        issueCommentCreate={issueCommentCreate}
        issueCommentUpdate={issueCommentUpdate}
        issueCommentRemove={issueCommentRemove}
        issueCommentReactionCreate={issueCommentReactionCreate}
        issueCommentReactionRemove={issueCommentReactionRemove}
        issueSubscriptionCreate={issueSubscriptionCreate}
        issueSubscriptionRemove={issueSubscriptionRemove}
        issueLinkCreate={issueLinkCreate}
        issueLinkUpdate={issueLinkUpdate}
        issueLinkDelete={issueLinkDelete}
        handleDeleteIssue={handleDeleteIssue}
        disableUserActions={[5, 10].includes(userRole)}
        showCommentAccessSpecifier={currentProjectDetails?.is_deployed}
      />
    </Fragment>
  );
});
