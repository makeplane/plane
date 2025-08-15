"use client";

import { FC, useEffect, useState, useMemo, useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EPIC_TRACKER_EVENTS, EUserPermissionsLevel } from "@plane/constants";
import { EIssueServiceType, EUserProjectRoles, TIssue, IWorkItemPeekOverview } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import type { TIssueOperations } from "@/components/issues/issue-detail";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssueDetail } from "@/hooks/store/use-issue-detail"
import { useUserPermissions } from "@/hooks/store/user";
// plane web constants
import { useWorkItemProperties } from "@/plane-web/hooks/use-issue-properties";
import { EpicView } from "./view";

export const EpicPeekOverview: FC<IWorkItemPeekOverview> = observer((props) => {
  const { embedIssue = false, embedRemoveCurrentNotification } = props;
  // store hook
  const { allowPermissions } = useUserPermissions();

  const {
    peekIssue,
    setPeekIssue,
    issue: { fetchIssue, getIsFetchingIssueDetails, updateIssue, removeIssue },
    fetchActivities,
  } = useIssueDetail(EIssueServiceType.EPICS);
  useWorkItemProperties(peekIssue?.projectId, peekIssue?.workspaceSlug, peekIssue?.issueId, EIssueServiceType.EPICS);
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
          await fetchIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          setError(true);
          console.error("Error fetching the parent work item", error);
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        if (updateIssue) {
          await updateIssue(workspaceSlug, projectId, issueId, data)
            .then(async () => {
              fetchActivities(workspaceSlug, projectId, issueId);
              captureSuccess({
                eventName: EPIC_TRACKER_EVENTS.update,
                payload: {
                  id: issueId,
                },
              });
            })
            .catch(() => {
              captureError({
                eventName: EPIC_TRACKER_EVENTS.update,
                payload: {
                  id: issueId,
                },
              });
              setToast({
                title: "Error!",
                type: TOAST_TYPE.ERROR,
                message: "Work item update failed",
              });
            });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          return removeIssue(workspaceSlug, projectId, issueId).then(() => {
            captureSuccess({
              eventName: EPIC_TRACKER_EVENTS.delete,
              payload: {
                id: issueId,
              },
            });
            removeRoutePeekId();
          });
        } catch {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Work item delete failed",
          });
          captureError({
            eventName: EPIC_TRACKER_EVENTS.delete,
            payload: {
              id: issueId,
            },
          });
        }
      },
    }),
    [fetchIssue, updateIssue, removeIssue, fetchActivities, removeRoutePeekId]
  );

  useEffect(() => {
    if (peekIssue) {
      issueOperations.fetch(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);
    }
  }, [peekIssue, issueOperations]);

  if (!peekIssue?.workspaceSlug || !peekIssue?.projectId || !peekIssue?.issueId) return <></>;

  // Check if issue is editable, based on user role
  const isEditable = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT,
    peekIssue?.workspaceSlug,
    peekIssue?.projectId
  );

  return (
    <EpicView
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
