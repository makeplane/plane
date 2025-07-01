"use client";

import { FC, useEffect, useState, useMemo, useCallback } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// Plane imports
import { EUserPermissions, EUserPermissionsLevel, WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, EIssuesStoreType, IWorkItemPeekOverview, TIssue } from "@plane/types";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { IssueView, TIssueOperations } from "@/components/issues";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssueDetail, useIssues, useUserPermissions } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useWorkItemProperties } from "@/plane-web/hooks/use-issue-properties";

export const IssuePeekOverview: FC<IWorkItemPeekOverview> = observer((props) => {
  const {
    embedIssue = false,
    embedRemoveCurrentNotification,
    is_draft = false,
    storeType: issueStoreFromProps,
  } = props;
  const { t } = useTranslation();
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
  const issueStoreType = useIssueStoreType();
  const storeType = issueStoreFromProps ?? issueStoreType;
  const { issues } = useIssues(storeType);

  useWorkItemProperties(
    peekIssue?.projectId,
    peekIssue?.workspaceSlug,
    peekIssue?.issueId,
    storeType === EIssuesStoreType.EPIC ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES
  );
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
              captureSuccess({
                eventName: WORK_ITEM_TRACKER_EVENTS.update,
                payload: { id: issueId },
              });
            })
            .catch((error) => {
              captureError({
                eventName: WORK_ITEM_TRACKER_EVENTS.update,
                payload: { id: issueId },
                error: error as Error,
              });
              setToast({
                title: t("toast.error"),
                type: TOAST_TYPE.ERROR,
                message: t("entity.update.failed", { entity: t("issue.label", { count: 1 }) }),
              });
            });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          return issues?.removeIssue(workspaceSlug, projectId, issueId).then(() => {
            captureSuccess({
              eventName: WORK_ITEM_TRACKER_EVENTS.delete,
              payload: { id: issueId },
            });
            removeRoutePeekId();
          });
        } catch (error) {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.delete.failed", { entity: t("issue.label", { count: 1 }) }),
          });
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.delete,
            payload: { id: issueId },
            error: error as Error,
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          if (!issues?.archiveIssue) return;
          await issues.archiveIssue(workspaceSlug, projectId, issueId);
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.archive,
            payload: { id: issueId },
          });
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.archive,
            payload: { id: issueId },
            error: error as Error,
          });
        }
      },
      restore: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await restoreIssue(workspaceSlug, projectId, issueId);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("issue.restore.success.title"),
            message: t("issue.restore.success.message"),
          });
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.restore,
            payload: { id: issueId },
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("issue.restore.failed.message"),
          });
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.restore,
            payload: { id: issueId },
            error: error as Error,
          });
        }
      },
      addCycleToIssue: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          await issues.addCycleToIssue(workspaceSlug, projectId, cycleId, issueId);
          fetchActivities(workspaceSlug, projectId, issueId);
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueId },
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("issue.add.cycle.failed"),
          });
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueId },
            error: error as Error,
          });
        }
      },
      addIssueToCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
        try {
          await issues.addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueIds },
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("issue.add.cycle.failed"),
          });
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueIds },
            error: error as Error,
          });
        }
      },
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          const removeFromCyclePromise = issues.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setPromiseToast(removeFromCyclePromise, {
            loading: t("issue.remove.cycle.loading"),
            success: {
              title: t("toast.success"),
              message: () => t("issue.remove.cycle.success"),
            },
            error: {
              title: t("toast.error"),
              message: () => t("issue.remove.cycle.failed"),
            },
          });
          await removeFromCyclePromise;
          fetchActivities(workspaceSlug, projectId, issueId);
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueId },
          });
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueId },
            error: error as Error,
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
        captureSuccess({
          eventName: WORK_ITEM_TRACKER_EVENTS.update,
          payload: { id: issueId },
        });
        return promise;
      },
      removeIssueFromModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
        try {
          const removeFromModulePromise = issues.removeIssuesFromModule(workspaceSlug, projectId, moduleId, [issueId]);
          setPromiseToast(removeFromModulePromise, {
            loading: t("issue.remove.module.loading"),
            success: {
              title: t("toast.success"),
              message: () => t("issue.remove.module.success"),
            },
            error: {
              title: t("toast.error"),
              message: () => t("issue.remove.module.failed"),
            },
          });
          await removeFromModulePromise;
          fetchActivities(workspaceSlug, projectId, issueId);
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueId },
          });
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueId },
            error: error as Error,
          });
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchIssue, is_draft, issues, fetchActivities, pathname, removeRoutePeekId, restoreIssue]
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
