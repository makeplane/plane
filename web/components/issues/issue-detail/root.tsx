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
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addIssueToModule: (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromModule: (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => Promise<void>;
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
    addIssueToCycle,
    removeIssueFromCycle,
    addIssueToModule,
    removeIssueFromModule,
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
    [
      updateIssue,
      removeIssue,
      addIssueToCycle,
      removeIssueFromCycle,
      addIssueToModule,
      removeIssueFromModule,
      setToastAlert,
    ]
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
            <IssueDetailsSidebar
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              is_archived={is_archived}
              is_editable={true}
            />
          </div>
        </div>
      )}
    </>
  );
};
