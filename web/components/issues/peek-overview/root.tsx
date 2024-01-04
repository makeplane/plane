import { FC, Fragment, useEffect, useState } from "react";
// router
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useIssueDetail, useIssues, useProject, useUser } from "hooks/store";
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
  const { currentProjectDetails } = useProject();
  const { setToastAlert } = useToast();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const {
    peekIssue,
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
  // state
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    if (peekIssue) {
      setLoader(true);
      fetchIssue(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId).finally(() => {
        setLoader(false);
      });
    }
  }, [peekIssue, fetchIssue]);

  if (!peekIssue) return <></>;

  const issue = getIssueById(peekIssue.issueId) || undefined;

  const redirectToIssueDetail = () => {
    router.push({
      pathname: `/${peekIssue.workspaceSlug}/projects/${peekIssue.projectId}/${
        isArchived ? "archived-issues" : "issues"
      }/${peekIssue.issueId}`,
    });
  };
  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(
      `${peekIssue.workspaceSlug}/projects/${peekIssue.projectId}/${isArchived ? "archived-issues" : "issues"}/${
        peekIssue.issueId
      }`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const issueUpdate = async (_data: Partial<TIssue>) => {
    if (!issue) return;
    await updateIssue(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, _data);
    fetchActivities(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);
  };
  const issueDelete = async () => {
    if (!issue) return;
    if (isArchived) await removeArchivedIssue(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);
    else await removeIssue(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);
  };

  const issueReactionCreate = (reaction: string) =>
    createReaction(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, reaction);
  const issueReactionRemove = (reaction: string) =>
    removeReaction(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, reaction);

  const issueCommentCreate = (comment: any) =>
    createComment(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, comment);
  const issueCommentUpdate = (comment: any) =>
    updateComment(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, comment?.id, comment);
  const issueCommentRemove = (commentId: string) =>
    removeComment(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, commentId);

  const issueCommentReactionCreate = (commentId: string, reaction: string) =>
    createCommentReaction(peekIssue.workspaceSlug, peekIssue.projectId, commentId, reaction);
  const issueCommentReactionRemove = (commentId: string, reaction: string) =>
    removeCommentReaction(peekIssue.workspaceSlug, peekIssue.projectId, commentId, reaction);

  const issueSubscriptionCreate = () =>
    createSubscription(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);
  const issueSubscriptionRemove = () =>
    removeSubscription(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);

  const issueLinkCreate = (formData: IIssueLink) =>
    createLink(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, formData);
  const issueLinkUpdate = (formData: IIssueLink, linkId: string) =>
    updateLink(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, linkId, formData);
  const issueLinkDelete = (linkId: string) =>
    removeLink(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, linkId);

  const userRole = currentProjectRole ?? EUserProjectRoles.GUEST;
  const isLoading = !issue || loader ? true : false;

  return (
    <Fragment>
      {isLoading ? (
        <></> // TODO: show the spinner
      ) : (
        <IssueView
          workspaceSlug={peekIssue.workspaceSlug}
          projectId={peekIssue.projectId}
          issueId={peekIssue.issueId}
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
          handleDeleteIssue={issueDelete}
          disableUserActions={[5, 10].includes(userRole)}
          showCommentAccessSpecifier={currentProjectDetails?.is_deployed}
        />
      )}
    </Fragment>
  );
});
