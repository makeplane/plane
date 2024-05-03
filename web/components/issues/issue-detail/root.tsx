import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { TIssue } from "@plane/types";
// components
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
import { EmptyState } from "@/components/common";
import { IssuePeekOverview } from "@/components/issues";
import { ISSUE_UPDATED, ISSUE_DELETED, ISSUE_ARCHIVED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useApplication, useEventTracker, useIssueDetail, useIssues, useUser } from "@/hooks/store";
import emptyIssue from "public/empty-state/issue.svg";
import { IssueMainContent } from "./main-content";
import { IssueDetailsSidebar } from "./sidebar";
// ui
// images
// hooks
// types
// ui
// constants

export type TIssueOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archive?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  restore?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
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
  swrIssueDetails: TIssue | null | undefined;
};

export const IssueDetailRoot: FC<TIssueDetailRoot> = observer((props) => {
  const { workspaceSlug, projectId, issueId, swrIssueDetails, is_archived = false } = props;
  // router
  const router = useRouter();
  // hooks
  const {
    issue: { getIssueById },
    fetchIssue,
    updateIssue,
    removeIssue,
    archiveIssue,
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
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { theme: themeStore } = useApplication();

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
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: router.asPath,
          });
          setToast({
            title: "Issue update failed",
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
            title: "Issue deleted successfully",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            path: router.asPath,
          });
        } catch (error) {
          setToast({
            title: "Issue delete failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue delete failed",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: router.asPath,
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await archiveIssue(workspaceSlug, projectId, issueId);
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue details page" },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "FAILED", element: "Issue details page" },
            path: router.asPath,
          });
        }
      },
      addIssueToCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
        try {
          const addToCyclePromise = addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
          setPromiseToast(addToCyclePromise, {
            loading: "Adding cycle to issue...",
            success: {
              title: "Success!",
              message: () => "Cycle added to issue successfully",
            },
            error: {
              title: "Error!",
              message: () => "Cycle add to issue failed",
            },
          });
          await addToCyclePromise;
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...issueIds, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
        }
      },
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          const removeFromCyclePromise = removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setPromiseToast(removeFromCyclePromise, {
            loading: "Removing cycle from issue...",
            success: {
              title: "Success!",
              message: () => "Cycle removed from issue successfully",
            },
            error: {
              title: "Error!",
              message: () => "Cycle remove from issue failed",
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
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: router.asPath,
          });
        }
      },
      addModulesToIssue: async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
        try {
          const addToModulePromise = addModulesToIssue(workspaceSlug, projectId, issueId, moduleIds);
          setPromiseToast(addToModulePromise, {
            loading: "Adding module to issue...",
            success: {
              title: "Success!",
              message: () => "Module added to issue successfully",
            },
            error: {
              title: "Error!",
              message: () => "Module add to issue failed",
            },
          });
          const response = await addToModulePromise;
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...response, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: moduleIds,
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: moduleIds,
            },
            path: router.asPath,
          });
        }
      },
      removeIssueFromModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
        try {
          const removeFromModulePromise = removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);
          setPromiseToast(removeFromModulePromise, {
            loading: "Removing module from issue...",
            success: {
              title: "Success!",
              message: () => "Module removed from issue successfully",
            },
            error: {
              title: "Error!",
              message: () => "Module remove from issue failed",
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
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: router.asPath,
          });
        }
      },
      removeModulesFromIssue: async (
        workspaceSlug: string,
        projectId: string,
        issueId: string,
        moduleIds: string[]
      ) => {
        const removeModulesFromIssuePromise = removeModulesFromIssue(workspaceSlug, projectId, issueId, moduleIds);
        setPromiseToast(removeModulesFromIssuePromise, {
          loading: "Removing module from issue...",
          success: {
            title: "Success!",
            message: () => "Module removed from issue successfully",
          },
          error: {
            title: "Error!",
            message: () => "Module remove from issue failed",
          },
        });
        await removeModulesFromIssuePromise;
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
      addModulesToIssue,
      removeIssueFromModule,
      removeModulesFromIssue,
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
            className="fixed right-0 z-[5] h-full w-full min-w-[300px] overflow-hidden border-l border-custom-border-200 bg-custom-sidebar-background-100 py-5 sm:w-1/2 md:relative md:w-1/3 lg:min-w-80 xl:min-w-96"
            style={themeStore.issueDetailSidebarCollapsed ? { right: `-${window?.innerWidth || 0}px` } : {}}
          >
            <IssueDetailsSidebar
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              is_archived={is_archived}
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
