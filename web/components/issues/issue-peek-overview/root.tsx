import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
// components
import { IssueView } from "./view";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IIssue } from "types";
import { RootStore } from "store/root";

interface IIssuePeekOverview {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  handleIssue: (issue: Partial<IIssue>) => void;
  children: ReactNode;
}

export const IssuePeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { workspaceSlug, projectId, issueId, handleIssue, children } = props;

  const { issueDetail: issueDetailStore }: RootStore = useMobxStore();

  const issueUpdate = (_data: Partial<IIssue>) => {
    handleIssue(_data);
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

  const handleDeleteIssue = () => issueDetailStore.deleteIssue(workspaceSlug, projectId, issueId);

  return (
    <IssueView
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
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
    >
      {children}
    </IssueView>
  );
});
