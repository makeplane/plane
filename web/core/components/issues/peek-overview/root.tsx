"use client";

import { FC, useEffect, useState, useMemo, useCallback } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// plane types
import { TIssue } from "@plane/types";
// plane ui
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { IssueView, TIssueOperations } from "@/components/issues";
// constants
import { ISSUE_UPDATED, ISSUE_DELETED, ISSUE_ARCHIVED, ISSUE_RESTORED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useEventTracker, useIssueDetail, useIssues, useUserPermissions } from "@/hooks/store";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

interface IIssuePeekOverview {
  embedIssue?: boolean;
  embedRemoveCurrentNotification?: () => void;
  is_draft?: boolean;
}

export const IssuePeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { embedIssue = false, embedRemoveCurrentNotification, is_draft = false } = props;
  // router
  const pathname = usePathname();
  // store hook
  const { allowPermissions } = useUserPermissions();

  const {
    issues: { restoreIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const {
    peekIssue,
    setPeekIssue,
    issue: { fetchIssue, getIsFetchingIssueDetails },
    fetchActivities,
  } = useIssueDetail();

  const { issues } = useIssuesStore();
  const { captureIssueEvent } = useEventTracker();
  // state
  const [error, setError] = useState(false);

  const removeRoutePeekId = useCallback(() => {
    setPeekIssue(undefined);
    if (embedIssue) embedRemoveCurrentNotification?.();
  }, [embedIssue, embedRemoveCurrentNotification, setPeekIssue]);

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          setError(false);
          await fetchIssue(workspaceSlug, projectId, issueId, is_draft ? "DRAFT" : "DEFAULT");
        } catch (error) {
          setError(true);
          console.error("Error fetching the parent issue", error);
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        if (issues?.updateIssue) {
          await issues
            .updateIssue(workspaceSlug, projectId, issueId, data)
            .then(async () => {
              fetchActivities(workspaceSlug, projectId, issueId);
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
            });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          return issues?.removeIssue(workspaceSlug, projectId, issueId).then(() => {
            captureIssueEvent({
              eventName: ISSUE_DELETED,
              payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
              path: pathname,
            });
            removeRoutePeekId();
          });
        } catch {
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
          if (!issues?.archiveIssue) return;
          await issues.archiveIssue(workspaceSlug, projectId, issueId);
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            path: pathname,
          });
        } catch {
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
        } catch {
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
          fetchActivities(workspaceSlug, projectId, issueId);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { issueId, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: pathname,
          });
        } catch {
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
        } catch {
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
          fetchActivities(workspaceSlug, projectId, issueId);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { issueId, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: pathname,
          });
        } catch {
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
        fetchActivities(workspaceSlug, projectId, issueId);
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
          fetchActivities(workspaceSlug, projectId, issueId);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: pathname,
          });
        } catch {
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
    [fetchIssue, is_draft, issues, fetchActivities, captureIssueEvent, pathname, removeRoutePeekId, restoreIssue]
  );

  useEffect(() => {
    if (peekIssue) {
      issueOperations.fetch(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);
    }
  }, [peekIssue, issueOperations]);

  if (!peekIssue?.workspaceSlug || !peekIssue?.projectId || !peekIssue?.issueId) return <></>;

  // Check if issue is editable, based on user role
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    peekIssue?.workspaceSlug,
    peekIssue?.projectId
  );

  return (
    <IssueView
      workspaceSlug={peekIssue.workspaceSlug}
      projectId={peekIssue.projectId}
      issueId={peekIssue.issueId}
      isLoading={getIsFetchingIssueDetails(peekIssue.issueId)}
      isError={error}
      is_archived={!!peekIssue.isArchived}
      disabled={!isEditable}
      embedIssue={embedIssue}
      embedRemoveCurrentNotification={embedRemoveCurrentNotification}
      issueOperations={issueOperations}
    />
  );
});
