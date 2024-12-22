"use client";

import { FC, useEffect, useState, useMemo, useCallback } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { EIssueServiceType } from "@plane/constants";
// plane types
import { TIssue } from "@plane/types";
// plane ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { TIssueOperations } from "@/components/issues";
// constants
import { ISSUE_UPDATED, ISSUE_DELETED } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useIssueDetail, useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { EpicView } from "./view";

interface IIssuePeekOverview {
  embedIssue?: boolean;
  embedRemoveCurrentNotification?: () => void;
}

export const EpicPeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { embedIssue = false, embedRemoveCurrentNotification } = props;
  const pathname = usePathname();
  // store hook
  const { allowPermissions } = useUserPermissions();

  const {
    peekIssue,
    setPeekIssue,
    issue: { fetchIssue, getIsFetchingIssueDetails, updateIssue, removeIssue },
    fetchActivities,
  } = useIssueDetail(EIssueServiceType.EPICS);
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
          await fetchIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          setError(true);
          console.error("Error fetching the parent issue", error);
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        if (updateIssue) {
          await updateIssue(workspaceSlug, projectId, issueId, data)
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
          return removeIssue(workspaceSlug, projectId, issueId).then(() => {
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
    }),
    [fetchIssue, updateIssue, removeIssue, fetchActivities, captureIssueEvent, pathname, removeRoutePeekId]
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
