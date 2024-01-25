import { FC, useMemo } from "react";
import useSWR from "swr";
// components
import { InboxIssueMainContent } from "./main-content";
import { InboxIssueDetailsSidebar } from "./sidebar";
// hooks
import { useInboxIssues, useIssueDetail, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// types
import { TIssue } from "@plane/types";
import { TIssueOperations } from "../root";
// constants
import { EUserProjectRoles } from "constants/project";

export type TInboxIssueDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  issueId: string;
};

export const InboxIssueDetailRoot: FC<TInboxIssueDetailRoot> = (props) => {
  const { workspaceSlug, projectId, inboxId, issueId } = props;
  // hooks
  const {
    issues: { fetchInboxIssueById, updateInboxIssue, removeInboxIssue },
  } = useInboxIssues();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { setToastAlert } = useToast();
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
      update: async (
        workspaceSlug: string,
        projectId: string,
        issueId: string,
        data: Partial<TIssue>,
        showToast: boolean = true
      ) => {
        try {
          await updateInboxIssue(workspaceSlug, projectId, inboxId, issueId, data);
          if (showToast) {
            setToastAlert({
              title: "Issue updated successfully",
              type: "success",
              message: "Issue updated successfully",
            });
          }
        } catch (error) {
          setToastAlert({
            title: "Issue update failed",
            type: "error",
            message: "Issue update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await removeInboxIssue(workspaceSlug, projectId, inboxId, issueId);
          setToastAlert({
            title: "Issue deleted successfully",
            type: "success",
            message: "Issue deleted successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Issue delete failed",
            type: "error",
            message: "Issue delete failed",
          });
        }
      },
    }),
    [inboxId, fetchInboxIssueById, updateInboxIssue, removeInboxIssue, setToastAlert]
  );

  useSWR(
    workspaceSlug && projectId && inboxId && issueId
      ? `INBOX_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${inboxId}_${issueId}`
      : null,
    async () => {
      if (workspaceSlug && projectId && inboxId && issueId) {
        await issueOperations.fetch(workspaceSlug, projectId, issueId);
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
      <div className="h-full w-2/3 space-y-5 divide-y-2 divide-custom-border-300 overflow-y-auto p-5">
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
