"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// types
import { TIssue } from "@plane/types";
// ui
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { EmptyState } from "@/components/common";
import { IssuePeekOverview } from "@/components/issues";
// constants
import { ISSUE_UPDATED, ISSUE_DELETED, ISSUE_ARCHIVED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useAppTheme, useEventTracker, useIssueDetail, useIssues, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// images
import emptyIssue from "@/public/empty-state/issue.svg";
// local components
import { IssueMainContent } from "./main-content";
import { IssueDetailsSidebar } from "./sidebar";

export type TIssueOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archive?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  restore?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  addCycleToIssue?: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addIssueToCycle?: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle?: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  removeIssueFromModule?: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string
  ) => Promise<void>;
  changeModulesInIssue?: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) => Promise<void>;
};

export type TIssueDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  is_archived?: boolean;
  swrIssueDetails: TIssue | null | undefined;
};

export const IssueDetailRoot: FC<TIssueDetailRoot> = observer((props) => {
  const { workspaceSlug, projectId, issueId, swrIssueDetails, is_archived = false } = props;
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  // hooks
  const {
    issue: { getIssueById },
    fetchIssue,
    updateIssue,
    removeIssue,
    archiveIssue,
    addCycleToIssue,
    addIssueToCycle,
    removeIssueFromCycle,
    changeModulesInIssue,
    removeIssueFromModule,
  } = useIssueDetail();
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { captureIssueEvent } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { issueDetailSidebarCollapsed } = useAppTheme();

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          console.error("Error fetching the parent issue");
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...data, issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          if (is_archived) await removeArchivedIssue(workspaceSlug, projectId, issueId);
          else await removeIssue(workspaceSlug, projectId, issueId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            path: pathname,
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue delete failed",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: pathname,
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await archiveIssue(workspaceSlug, projectId, issueId);
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue details page" },
            path: pathname,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "FAILED", element: "Issue details page" },
            path: pathname,
          });
        }
      },
      addCycleToIssue: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          await addCycleToIssue(workspaceSlug, projectId, cycleId, issueId);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: pathname,
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Issue could not be added to the cycle. Please try again.",
          });
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: pathname,
          });
        }
      },
      addIssueToCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
        try {
          await addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...issueIds, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: pathname,
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Issue could not be added to the cycle. Please try again.",
          });
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: pathname,
          });
        }
      },
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          const removeFromCyclePromise = removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setPromiseToast(removeFromCyclePromise, {
            loading: "Removing issue from the cycle...",
            success: {
              title: "Success!",
              message: () => "Issue removed from the cycle successfully.",
            },
            error: {
              title: "Error!",
              message: () => "Issue could not be removed from the cycle. Please try again.",
            },
          });
          await removeFromCyclePromise;
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: pathname,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: pathname,
          });
        }
      },
      removeIssueFromModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
        try {
          const removeFromModulePromise = removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);
          setPromiseToast(removeFromModulePromise, {
            loading: "Removing issue from the module...",
            success: {
              title: "Success!",
              message: () => "Issue removed from the module successfully.",
            },
            error: {
              title: "Error!",
              message: () => "Issue could not be removed from the module. Please try again.",
            },
          });
          await removeFromModulePromise;
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: pathname,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: pathname,
          });
        }
      },
      changeModulesInIssue: async (
        workspaceSlug: string,
        projectId: string,
        issueId: string,
        addModuleIds: string[],
        removeModuleIds: string[]
      ) => {
        const promise = await changeModulesInIssue(workspaceSlug, projectId, issueId, addModuleIds, removeModuleIds);
        captureIssueEvent({
          eventName: ISSUE_UPDATED,
          payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
          updates: {
            changed_property: "module_id",
            change_details: { addModuleIds, removeModuleIds },
          },
          path: pathname,
        });
        return promise;
      },
    }),
    [
      is_archived,
      fetchIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      removeArchivedIssue,
      addIssueToCycle,
      removeIssueFromCycle,
      changeModulesInIssue,
      removeIssueFromModule,
      captureIssueEvent,
      pathname,
    ]
  );

  // issue details
  const issue = getIssueById(issueId);
  // checking if issue is editable, based on user role
  const isEditable = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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
        <div className="flex h-full w-full overflow-hidden">
          <div className="max-w-2/3 h-full w-full space-y-5 divide-y-2 divide-custom-border-200 overflow-y-auto px-6 py-5">
            <IssueMainContent
              workspaceSlug={workspaceSlug}
              swrIssueDetails={swrIssueDetails}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              isEditable={!is_archived && isEditable}
              isArchived={is_archived}
            />
          </div>
          <div
            className="fixed right-0 z-[5] h-full w-full min-w-[300px] overflow-hidden border-l border-custom-border-200 bg-custom-sidebar-background-100 pb-5 sm:w-1/2 md:relative md:w-1/3 lg:min-w-80 xl:min-w-96"
            style={issueDetailSidebarCollapsed ? { right: `-${window?.innerWidth || 0}px` } : {}}
          >
            <IssueDetailsSidebar
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              isEditable={!is_archived && isEditable}
            />
          </div>
        </div>
      )}

      {/* peek overview */}
      <IssuePeekOverview />
    </>
  );
});
