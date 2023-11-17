import { FC, Fragment, ReactNode } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// components
import { IssueView } from "./view";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IIssue } from "types";
import { RootStore } from "store/root";
// hooks
import useToast from "hooks/use-toast";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";

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
  const { peekIssueId } = router.query as { peekIssueId: string };

  const {
    user: userStore,
    issue: issueStore,
    issueDetail: issueDetailStore,
    archivedIssueDetail: archivedIssueDetailStore,
    archivedIssues: archivedIssuesStore,
    project: projectStore,
  }: RootStore = useMobxStore();

  const { setToastAlert } = useToast();

  useSWR(
    workspaceSlug && projectId && issueId && peekIssueId && issueId === peekIssueId
      ? `ISSUE_PEEK_OVERVIEW_${workspaceSlug}_${projectId}_${peekIssueId}`
      : null,
    async () => {
      if (workspaceSlug && projectId && issueId && peekIssueId && issueId === peekIssueId) {
        if (isArchived) await archivedIssueDetailStore.fetchPeekIssueDetails(workspaceSlug, projectId, issueId);
        else await issueDetailStore.fetchPeekIssueDetails(workspaceSlug, projectId, issueId);
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
    if (handleIssue) {
      handleIssue(_data);
      issueDetailStore.updateIssue(workspaceSlug, projectId, issueId, _data);
    }
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
    else await issueStore.deleteIssue(workspaceSlug, projectId, issue!);
    const { query } = router;
    if (query.peekIssueId) {
      issueDetailStore.setPeekId(null);
      delete query.peekIssueId;
      router.push({
        pathname: router.pathname,
        query: { ...query },
      });
    }
  };

  const userRole = userStore.currentProjectRole ?? 5;

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
