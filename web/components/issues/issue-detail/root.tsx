import { FC, useMemo } from "react";
import { useRouter } from "next/router";
// components
import { IssuePeekOverview } from "components/issues";
import { IssueMainContent } from "./main-content";
import { IssueDetailsSidebar } from "./sidebar";
// ui
import { EmptyState } from "components/common";
// images
import emptyIssue from "public/empty-state/issue.svg";
// hooks
import { useEventTracker, useIssueDetail, useIssues, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// types
import { TIssue } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

export type TIssueOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  update: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    showToast?: boolean
  ) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  addIssueToCycle?: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle?: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addModulesToIssue?: (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => Promise<void>;
  removeIssueFromModule?: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string
  ) => Promise<void>;
  removeModulesFromIssue?: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ) => Promise<void>;
};

export type TIssueDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  is_archived?: boolean;
};

export const IssueDetailRoot: FC<TIssueDetailRoot> = (props) => {
  const { workspaceSlug, projectId, issueId, is_archived = false } = props;
  // router
  const router = useRouter();
  // hooks
  const {
    issue: { getIssueById },
    fetchIssue,
    updateIssue,
    removeIssue,
    addIssueToCycle,
    removeIssueFromCycle,
    addModulesToIssue,
    removeIssueFromModule,
    removeModulesFromIssue,
  } = useIssueDetail();
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { captureIssueEvent } = useEventTracker();
  const { setToastAlert } = useToast();
  const {
    membership: { currentProjectRole },
  } = useUser();

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchIssue(workspaceSlug, projectId, issueId);
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
          const response = await updateIssue(workspaceSlug, projectId, issueId, data);
          if (showToast) {
            setToastAlert({
              title: "Issue updated successfully",
              type: "success",
              message: "Issue updated successfully",
            });
          }
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { ...response, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: router.asPath,
          });
          setToastAlert({
            title: "Issue update failed",
            type: "error",
            message: "Issue update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          let response;
          if (is_archived) response = await removeArchivedIssue(workspaceSlug, projectId, issueId);
          else response = await removeIssue(workspaceSlug, projectId, issueId);
          setToastAlert({
            title: "Issue deleted successfully",
            type: "success",
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: "Issue deleted",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            path: router.asPath,
          });
        } catch (error) {
          setToastAlert({
            title: "Issue delete failed",
            type: "error",
            message: "Issue delete failed",
          });
          captureIssueEvent({
            eventName: "Issue deleted",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: router.asPath,
          });
        }
      },
      addIssueToCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
        try {
          const response = await addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
          setToastAlert({
            title: "Cycle added to issue successfully",
            type: "success",
            message: "Issue added to issue successfully",
          });
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { ...response, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
          setToastAlert({
            title: "Cycle add to issue failed",
            type: "error",
            message: "Cycle add to issue failed",
          });
        }
      },
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          const response = await removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setToastAlert({
            title: "Cycle removed from issue successfully",
            type: "success",
            message: "Cycle removed from issue successfully",
          });
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { ...response, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: router.asPath,
          });
          setToastAlert({
            title: "Cycle remove from issue failed",
            type: "error",
            message: "Cycle remove from issue failed",
          });
        }
      },
      addModulesToIssue: async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
        try {
          const response = await addModulesToIssue(workspaceSlug, projectId, issueId, moduleIds);
          setToastAlert({
            title: "Module added to issue successfully",
            type: "success",
            message: "Module added to issue successfully",
          });
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { ...response, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: moduleIds,
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: moduleIds,
            },
            path: router.asPath,
          });
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
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue updated",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: router.asPath,
          });
          setToastAlert({
            title: "Module remove from issue failed",
            type: "error",
            message: "Module remove from issue failed",
          });
        }
      },
      removeModulesFromIssue: async (
        workspaceSlug: string,
        projectId: string,
        issueId: string,
        moduleIds: string[]
      ) => {
        try {
          await removeModulesFromIssue(workspaceSlug, projectId, issueId, moduleIds);
          setToastAlert({
            type: "success",
            title: "Successful!",
            message: "Issue removed from module successfully.",
          });
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Issue could not be removed from module. Please try again.",
          });
        }
      },
    }),
    [
      is_archived,
      fetchIssue,
      updateIssue,
      removeIssue,
      removeArchivedIssue,
      addIssueToCycle,
      removeIssueFromCycle,
      addModulesToIssue,
      removeIssueFromModule,
      removeModulesFromIssue,
      setToastAlert,
    ]
  );

  // issue details
  const issue = getIssueById(issueId);
  // checking if issue is editable, based on user role
  const is_editable = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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
              is_editable={!is_archived && is_editable}
            />
          </div>
          <div className="h-full w-1/3 space-y-5 overflow-hidden border-l border-custom-border-300 py-5">
            <IssueDetailsSidebar
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              is_archived={is_archived}
              is_editable={!is_archived && is_editable}
            />
          </div>
        </div>
      )}

      {/* peek overview */}
      <IssuePeekOverview />
    </>
  );
};
