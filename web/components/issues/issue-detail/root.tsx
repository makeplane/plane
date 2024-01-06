import { FC, useMemo } from "react";
import { useRouter } from "next/router";
// components
import { IssueMainContent } from "./main-content";
import { IssueDetailsSidebar } from "./sidebar";
// ui
import { EmptyState } from "components/common";
// images
import emptyIssue from "public/empty-state/issue.svg";
// hooks
import { useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// types
import { TIssue } from "@plane/types";

export type TIssueOperations = {
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

export type TIssueDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  is_archived?: boolean;
  is_editable?: boolean;
};

export const IssueDetailRoot: FC<TIssueDetailRoot> = (props) => {
  const { workspaceSlug, projectId, issueId, is_archived = false, is_editable = true } = props;
  // router
  const router = useRouter();
  // hooks
  const {
    issue: { getIssueById },
    updateIssue,
    removeIssue,
  } = useIssueDetail();
  const { setToastAlert } = useToast();

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          setToastAlert({
            title: "Issue updated successfully",
            type: "success",
            message: "Issue updated successfully",
          });
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
          await removeIssue(workspaceSlug, projectId, issueId);
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
    [updateIssue, removeIssue, setToastAlert]
  );

  const issue = getIssueById(issueId);

  return (
    <>
      {!issue ? (
        <EmptyState
          image={emptyIssue}
          title="Issue does not exist"
          description="The issue you are looking for does not exist, has been archived, or has been deleted."
          primaryButton={{
            text: "View other issues",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/issues`),
          }}
        />
      ) : (
        <div className="flex h-full overflow-hidden">
          <div className="h-full w-2/3 space-y-5 divide-y-2 divide-custom-border-300 overflow-y-auto p-5">
            <IssueMainContent
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              is_archived={is_archived}
              is_editable={is_editable}
            />
          </div>
          <div className="h-full w-1/3 space-y-5 overflow-hidden border-l border-custom-border-300 py-5">
            {/* <IssueDetailsSidebar
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              is_archived={is_archived}
              is_editable={is_editable}
            /> */}
          </div>
        </div>
      )}
    </>
  );
};
