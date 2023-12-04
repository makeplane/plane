import { FC, Fragment, ReactNode } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import { IssueView } from "./view";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { IIssue } from "types";
import { EUserWorkspaceRoles } from "constants/workspace";

interface IIssuePeekOverview {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  handleIssue: (issue: Partial<IIssue>) => void;
  isArchived?: boolean;
  children?: ReactNode;
}

export const IssuePeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { workspaceSlug, projectId, issueId, handleIssue, children, isArchived = false } = props;

  const router = useRouter();
  const { peekIssueId } = router.query;

  const {
    user: userStore,
    issue: issueStore,
    issueDetail: issueDetailStore,
    archivedIssueDetail: archivedIssueDetailStore,
    archivedIssues: archivedIssuesStore,
    project: projectStore,
  } = useMobxStore();

  const { setToastAlert } = useToast();

  useSWR(
    workspaceSlug && projectId && issueId && peekIssueId && issueId === peekIssueId
      ? `ISSUE_DETAILS_${workspaceSlug}_${projectId}_${peekIssueId}`
      : null,
    async () => {
      if (workspaceSlug && projectId && issueId && issueId === peekIssueId) {
        if (isArchived) await archivedIssueDetailStore.fetchPeekIssueDetails(workspaceSlug, projectId, peekIssueId);
        else await issueDetailStore.fetchPeekIssueDetails(workspaceSlug, projectId, peekIssueId);
      }
    }
  );

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(
      `${workspaceSlug}/projects/${projectId}/${isArchived ? "archived-issues" : "issues"}/${peekIssueId}`
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

  const issue = isArchived ? archivedIssueDetailStore.getIssue : issueDetailStore.getIssue;
  const isLoading = isArchived ? archivedIssueDetailStore.loader : issueDetailStore.loader;

  const issueUpdate = (_data: Partial<IIssue>) => {
    if (handleIssue) handleIssue(_data);
  };

  const issueReactionCreate = (reaction: string) =>
    issueDetailStore.createIssueReaction(workspaceSlug, projectId, issueId, reaction);

  const issueReactionRemove = (reaction: string) =>
    issueDetailStore.removeIssueReaction(workspaceSlug, projectId, issueId, reaction);

  const issueCommentCreate = (comment: any) =>
    issueDetailStore.createIssueComment(workspaceSlug, projectId, issueId, comment);

  const issueCommentUpdate = (comment: any) =>
    issueDetailStore.updateIssueComment(workspaceSlug, projectId, issueId, comment?.id, comment);

  const issueCommentRemove = (commentId: string) =>
    issueDetailStore.removeIssueComment(workspaceSlug, projectId, issueId, commentId);

  const issueCommentReactionCreate = (commentId: string, reaction: string) =>
    issueDetailStore.creationIssueCommentReaction(workspaceSlug, projectId, issueId, commentId, reaction);

  const issueCommentReactionRemove = (commentId: string, reaction: string) =>
    issueDetailStore.removeIssueCommentReaction(workspaceSlug, projectId, issueId, commentId, reaction);

  const issueSubscriptionCreate = () => issueDetailStore.createIssueSubscription(workspaceSlug, projectId, issueId);

  const issueSubscriptionRemove = () => issueDetailStore.removeIssueSubscription(workspaceSlug, projectId, issueId);

  const handleDeleteIssue = async () => {
    if (isArchived) await archivedIssuesStore.deleteArchivedIssue(workspaceSlug, projectId, issue!);
    else await issueStore.removeIssueFromStructure(workspaceSlug, projectId, issue!);
    const { query } = router;
    if (query.peekIssueId) {
      issueDetailStore.setPeekId(null);
      delete query.peekIssueId;
      delete query.peekProjectId;
      router.push({
        pathname: router.pathname,
        query: { ...query },
      });
    }
  };

  const userRole = userStore.currentProjectRole ?? EUserWorkspaceRoles.GUEST;

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
        handleDeleteIssue={handleDeleteIssue}
        disableUserActions={[5, 10].includes(userRole)}
        showCommentAccessSpecifier={projectStore.currentProjectDetails?.is_deployed}
      >
        {children}
      </IssueView>
    </Fragment>
  );
});
