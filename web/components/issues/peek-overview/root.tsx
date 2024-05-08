import { FC, useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { TIssue } from "@plane/types";
// ui
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { IssueView } from "@/components/issues";
// constants
import { ISSUE_UPDATED, ISSUE_DELETED, ISSUE_ARCHIVED, ISSUE_RESTORED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useEventTracker, useIssueDetail, useIssues, useUser } from "@/hooks/store";

interface IIssuePeekOverview {
  is_archived?: boolean;
  is_draft?: boolean;
}

export type TIssuePeekOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archive: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  restore: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
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

export const IssuePeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { is_archived = false, is_draft = false } = props;
  // router
  const router = useRouter();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const {
    issues: { restoreIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const {
    peekIssue,
    updateIssue,
    removeIssue,
    archiveIssue,
    issue: { getIssueById, fetchIssue },
  } = useIssueDetail();
  const {
    addCycleToIssue,
    addIssueToCycle,
    removeIssueFromCycle,
    addModulesToIssue,
    removeIssueFromModule,
    removeModulesFromIssue,
  } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();
  // state
  const [loader, setLoader] = useState(false);

  const issueOperations: TIssuePeekOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchIssue(
            workspaceSlug,
            projectId,
            issueId,
            is_archived ? "ARCHIVED" : is_draft ? "DRAFT" : "DEFAULT"
          );
        } catch (error) {
          console.error("Error fetching the parent issue");
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        await updateIssue(workspaceSlug, projectId, issueId, data)
          .then(() => {
            captureIssueEvent({
              eventName: ISSUE_UPDATED,
              payload: { ...data, issueId, state: "SUCCESS", element: "Issue peek-overview" },
              updates: {
                changed_property: Object.keys(data).join(","),
                change_details: Object.values(data).join(","),
              },
              path: router.asPath,
            });
          })
          .catch(() => {
            captureIssueEvent({
              eventName: ISSUE_UPDATED,
              payload: { state: "FAILED", element: "Issue peek-overview" },
              path: router.asPath,
            });
            setToast({
              title: "Error!",
              type: TOAST_TYPE.ERROR,
              message: "Issue update failed",
            });
          });
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          removeIssue(workspaceSlug, projectId, issueId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            path: router.asPath,
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue delete failed",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            path: router.asPath,
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await archiveIssue(workspaceSlug, projectId, issueId);
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            path: router.asPath,
          });
        }
      },
      restore: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await restoreIssue(workspaceSlug, projectId, issueId);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Restore success",
            message: "Your issue can be found in project issues.",
          });
          captureIssueEvent({
            eventName: ISSUE_RESTORED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            path: router.asPath,
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Issue could not be restored. Please try again.",
          });
          captureIssueEvent({
            eventName: ISSUE_RESTORED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            path: router.asPath,
          });
        }
      },
      addCycleToIssue: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          console.log("Peek adding...");
          await addCycleToIssue(workspaceSlug, projectId, cycleId, issueId);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { issueId, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Issue could not be added to the cycle. Please try again.",
          });
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
        }
      },
      addIssueToCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
        try {
          await addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...issueIds, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Issue could not be added to the cycle. Please try again.",
          });
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue peek-overview" },
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
            payload: { issueId, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue peek-overview" },
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
          const response = await addModulesToIssue(workspaceSlug, projectId, issueId, moduleIds);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...response, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "module_id",
              change_details: moduleIds,
            },
            path: router.asPath,
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Issue could not be added to the module. Please try again.",
          });
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
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
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
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
      is_draft,
      fetchIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      restoreIssue,
      addIssueToCycle,
      removeIssueFromCycle,
      addModulesToIssue,
      removeIssueFromModule,
      removeModulesFromIssue,
      captureIssueEvent,
      router.asPath,
    ]
  );

  useEffect(() => {
    if (peekIssue) {
      setLoader(true);
      issueOperations.fetch(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId).finally(() => {
        setLoader(false);
      });
    }
  }, [peekIssue, issueOperations]);

  if (!peekIssue?.workspaceSlug || !peekIssue?.projectId || !peekIssue?.issueId) return <></>;

  const issue = getIssueById(peekIssue.issueId) || undefined;

  const currentProjectRole = currentWorkspaceAllProjectsRole?.[peekIssue?.projectId];
  // Check if issue is editable, based on user role
  const isEditable = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const isLoading = !issue || loader ? true : false;

  return (
    <IssueView
      workspaceSlug={peekIssue.workspaceSlug}
      projectId={peekIssue.projectId}
      issueId={peekIssue.issueId}
      isLoading={isLoading}
      is_archived={is_archived}
      disabled={!isEditable}
      issueOperations={issueOperations}
    />
  );
});
