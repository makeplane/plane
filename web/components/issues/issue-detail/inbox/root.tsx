import { FC, useMemo } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { TIssue } from "@plane/types";
// components
import { TOAST_TYPE, setToast } from "@plane/ui";
import { EUserProjectRoles } from "@/constants/project";
import { useEventTracker, useInboxIssues, useIssueDetail, useUser } from "@/hooks/store";
// ui
// types
import { TIssueOperations } from "../root";
import { InboxIssueMainContent } from "./main-content";
import { InboxIssueDetailsSidebar } from "./sidebar";
// constants

export type TInboxIssueDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  issueId: string;
};

export const InboxIssueDetailRoot: FC<TInboxIssueDetailRoot> = (props) => {
  const { workspaceSlug, projectId, inboxId, issueId } = props;
  // router
  const router = useRouter();
  // hooks
  const {
    issues: { fetchInboxIssueById, updateInboxIssue, removeInboxIssue },
  } = useInboxIssues();
  const {
    issue: { getIssueById },
    fetchActivities,
    fetchComments,
  } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchInboxIssueById(workspaceSlug, projectId, inboxId, issueId);
        } catch (error) {
          console.error("Error fetching the parent issue");
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateInboxIssue(workspaceSlug, projectId, inboxId, issueId, data);
          captureIssueEvent({
            eventName: "Inbox issue updated",
            payload: { ...data, state: "SUCCESS", element: "Inbox" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: router.asPath,
          });
        } catch (error) {
          setToast({
            title: "Issue update failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue update failed",
          });
          captureIssueEvent({
            eventName: "Inbox issue updated",
            payload: { state: "SUCCESS", element: "Inbox" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: router.asPath,
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await removeInboxIssue(workspaceSlug, projectId, inboxId, issueId);
          setToast({
            title: "Issue deleted successfully",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: "Inbox issue deleted",
            payload: { id: issueId, state: "SUCCESS", element: "Inbox" },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Inbox issue deleted",
            payload: { id: issueId, state: "FAILED", element: "Inbox" },
            path: router.asPath,
          });
          setToast({
            title: "Issue delete failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue delete failed",
          });
        }
      },
    }),
    [inboxId, fetchInboxIssueById, updateInboxIssue, removeInboxIssue]
  );

  useSWR(
    workspaceSlug && projectId && inboxId && issueId
      ? `INBOX_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${inboxId}_${issueId}`
      : null,
    async () => {
      if (workspaceSlug && projectId && inboxId && issueId) {
        await issueOperations.fetch(workspaceSlug, projectId, issueId);
        await fetchActivities(workspaceSlug, projectId, issueId);
        await fetchComments(workspaceSlug, projectId, issueId);
      }
    }
  );

  // checking if issue is editable, based on user role
  const is_editable = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  // issue details
  const issue = getIssueById(issueId);

  if (!issue) return <></>;
  return (
    <div className="flex h-full overflow-hidden">
      <div className="h-full w-2/3 space-y-5 divide-y-2 divide-custom-border-300 overflow-y-auto p-5 vertical-scrollbar scrollbar-md">
        <InboxIssueMainContent
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          inboxId={inboxId}
          issueId={issueId}
          issueOperations={issueOperations}
          is_editable={is_editable}
        />
      </div>
      <div className="h-full w-1/3 space-y-5 overflow-hidden border-l border-custom-border-300 py-5">
        <InboxIssueDetailsSidebar
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueOperations={issueOperations}
          is_editable={is_editable}
        />
      </div>
    </div>
  );
};
