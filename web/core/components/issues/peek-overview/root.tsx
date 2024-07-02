"use client";

import { FC, useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { TIssue } from "@plane/types";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { IssueView } from "@/components/issues";
// constants
import { ISSUE_UPDATED, ISSUE_DELETED, ISSUE_ARCHIVED, ISSUE_RESTORED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useEventTracker, useIssueDetail, useIssues, useUser } from "@/hooks/store";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";

interface IIssuePeekOverview {
  embedIssue?: boolean;
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
  const { embedIssue = false, is_archived = false, is_draft = false } = props;
  // router
  const pathname = usePathname();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const {
    issues: { restoreIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const {
    peekIssue,
    issue: { fetchIssue },
  } = useIssueDetail();

  const { issues } = useIssuesStore();
  const { captureIssueEvent } = useEventTracker();
  // state
  const [loader, setLoader] = useState(true);
  const [error, setError] = useState(false);

  const issueOperations: TIssuePeekOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          setLoader(true);
          setError(false);
          await fetchIssue(
            workspaceSlug,
            projectId,
            issueId,
            is_archived ? "ARCHIVED" : is_draft ? "DRAFT" : "DEFAULT"
          );
          setLoader(false);
          setError(false);
        } catch (error) {
          setLoader(false);
          setError(true);
          console.error("Error fetching the parent issue");
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        issues?.updateIssue &&
          (await issues
            .updateIssue(workspaceSlug, projectId, issueId, data)
            .then(() => {
              captureIssueEvent({
                eventName: ISSUE_UPDATED,
                payload: { ...data, issueId, state: "SUCCESS", element: "Issue peek-overview" },
                updates: {
                  changed_property: Object.keys(data).join(","),
                  change_details: Object.values(data).join(","),
                },
                path: pathname,
              });
            })
            .catch(() => {
              captureIssueEvent({
                eventName: ISSUE_UPDATED,
                payload: { state: "FAILED", element: "Issue peek-overview" },
                path: pathname,
              });
              setToast({
                title: "Error!",
                type: TOAST_TYPE.ERROR,
                message: "Issue update failed",
              });
            }));
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          issues?.removeIssue(workspaceSlug, projectId, issueId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
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
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            path: pathname,
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          issues?.archiveIssue && (await issues.archiveIssue(workspaceSlug, projectId, issueId));
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            path: pathname,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            path: pathname,
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
            path: pathname,
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
            path: pathname,
          });
        }
      },
      addCycleToIssue: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          await issues.addCycleToIssue(workspaceSlug, projectId, cycleId, issueId);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { issueId, state: "SUCCESS", element: "Issue peek-overview" },
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
            payload: { state: "FAILED", element: "Issue peek-overview" },
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
          await issues.addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...issueIds, state: "SUCCESS", element: "Issue peek-overview" },
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
            payload: { state: "FAILED", element: "Issue peek-overview" },
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
          const removeFromCyclePromise = issues.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
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
            path: pathname,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
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
        const promise = await issues.changeModulesInIssue(
          workspaceSlug,
          projectId,
          issueId,
          addModuleIds,
          removeModuleIds
        );
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
      removeIssueFromModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
        try {
          const removeFromModulePromise = issues.removeIssuesFromModule(workspaceSlug, projectId, moduleId, [issueId]);
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
            path: pathname,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: pathname,
          });
        }
      },
    }),
    [is_archived, is_draft, fetchIssue, issues, restoreIssue, captureIssueEvent, pathname]
  );

  useEffect(() => {
    if (peekIssue) {
      issueOperations.fetch(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);
    }
  }, [peekIssue, issueOperations]);

  if (!peekIssue?.workspaceSlug || !peekIssue?.projectId || !peekIssue?.issueId) return <></>;

  const currentProjectRole = currentWorkspaceAllProjectsRole?.[peekIssue?.projectId];
  // Check if issue is editable, based on user role
  const isEditable = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <IssueView
      workspaceSlug={peekIssue.workspaceSlug}
      projectId={peekIssue.projectId}
      issueId={peekIssue.issueId}
      isLoading={loader}
      isError={error}
      is_archived={is_archived}
      disabled={!isEditable}
      embedIssue={embedIssue}
      issueOperations={issueOperations}
    />
  );
});
