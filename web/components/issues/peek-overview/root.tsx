import { FC, Fragment, useEffect, useState, useMemo } from "react";
// router
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useIssueDetail, useIssues, useMember, useProject, useUser } from "hooks/store";
// components
import { IssueView } from "components/issues";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { TIssue } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

interface IIssuePeekOverview {
  isArchived?: boolean;
}

export type TIssuePeekOperations = {
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addIssueToModule: (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromModule: (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => Promise<void>;
};

export const IssuePeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { isArchived = false } = props;
  // router
  const router = useRouter();
  // hooks
  const {
    project: {},
  } = useMember();
  const { currentProjectDetails } = useProject();
  const { setToastAlert } = useToast();
  const {
    currentUser,
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
    issue: { getIssueById, fetchIssue },
    fetchActivities,
  } = useIssueDetail();
  const { addIssueToCycle, removeIssueFromCycle, addIssueToModule, removeIssueFromModule } = useIssueDetail();
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

  const issueOperations: TIssuePeekOperations = useMemo(
    () => ({
      addIssueToCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
        try {
          await addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
          setToastAlert({
            title: "Cycle added to issue successfully",
            type: "success",
            message: "Issue added to issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Cycle add to issue failed",
            type: "error",
            message: "Cycle add to issue failed",
          });
        }
      },
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          await removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setToastAlert({
            title: "Cycle removed from issue successfully",
            type: "success",
            message: "Cycle removed from issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Cycle remove from issue failed",
            type: "error",
            message: "Cycle remove from issue failed",
          });
        }
      },
      addIssueToModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => {
        try {
          await addIssueToModule(workspaceSlug, projectId, moduleId, issueIds);
          setToastAlert({
            title: "Module added to issue successfully",
            type: "success",
            message: "Module added to issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Module add to issue failed",
            type: "error",
            message: "Module add to issue failed",
          });
        }
      },
      removeIssueFromModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
        try {
          await removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);
          setToastAlert({
            title: "Module removed from issue successfully",
            type: "success",
            message: "Module removed from issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Module remove from issue failed",
            type: "error",
            message: "Module remove from issue failed",
          });
        }
      },
    }),
    [addIssueToCycle, removeIssueFromCycle, addIssueToModule, removeIssueFromModule, setToastAlert]
  );

  if (!peekIssue?.workspaceSlug || !peekIssue?.projectId || !peekIssue?.issueId) return <></>;

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
    currentUser &&
    currentUser.id &&
    removeReaction(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId, reaction, currentUser.id);

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

  const userRole = currentProjectRole ?? EUserProjectRoles.GUEST;
  const isLoading = !issue || loader ? true : false;

  return (
    <Fragment>
      <IssueView
        workspaceSlug={peekIssue.workspaceSlug}
        projectId={peekIssue.projectId}
        issueId={peekIssue.issueId}
        isLoading={isLoading}
        isArchived={isArchived}
        issue={issue}
        handleCopyText={handleCopyText}
        redirectToIssueDetail={redirectToIssueDetail}
        issueUpdate={issueUpdate}
        issueDelete={issueDelete}
        issueReactionCreate={issueReactionCreate}
        issueReactionRemove={issueReactionRemove}
        issueCommentCreate={issueCommentCreate}
        issueCommentUpdate={issueCommentUpdate}
        issueCommentRemove={issueCommentRemove}
        issueCommentReactionCreate={issueCommentReactionCreate}
        issueCommentReactionRemove={issueCommentReactionRemove}
        issueSubscriptionCreate={issueSubscriptionCreate}
        issueSubscriptionRemove={issueSubscriptionRemove}
        disableUserActions={[5, 10].includes(userRole)}
        showCommentAccessSpecifier={currentProjectDetails?.is_deployed}
        issueOperations={issueOperations}
      />
    </Fragment>
  );
});
