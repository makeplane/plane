/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue, IWorkItemPeekOverview } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// components
import type { TIssueOperations } from "@/components/issues/issue-detail";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";
// plane web constants
import { useWorkItemProperties } from "@/plane-web/hooks/use-issue-properties";
import { EpicView } from "./view";
import { useIssues } from "@/hooks/store/use-issues";

export const EpicPeekOverview = observer(function EpicPeekOverview(props: IWorkItemPeekOverview) {
  const { embedIssue = false, embedRemoveCurrentNotification } = props;
  const { t } = useTranslation();
  // store hook
  const { permissions } = useEpics();

  const {
    issues: { restoreIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED_EPIC);
  const {
    peekIssue,
    setPeekIssue,
    issue: { fetchIssue, getIsFetchingIssueDetails, updateIssue, removeIssue, archiveIssue },
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
        try {
          if (updateIssue) {
            await updateIssue(workspaceSlug, projectId, issueId, data);
            await fetchActivities(workspaceSlug, projectId, issueId);
          }
        } catch (error) {
          console.error("Error updating the parent work item", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Work item update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await removeIssue(workspaceSlug, projectId, issueId);
          removeRoutePeekId();
        } catch (_error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Work item delete failed",
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await archiveIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          console.error("Error archiving the issue", error);
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
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("issue.restore.failed.message"),
          });
        }
      },
    }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [fetchIssue, updateIssue, removeIssue, fetchActivities, removeRoutePeekId, archiveIssue, restoreIssue]
  );

  useEffect(() => {
    if (peekIssue) {
      issueOperations.fetch(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId);
    }
  }, [peekIssue, issueOperations]);

  if (!peekIssue?.workspaceSlug || !peekIssue?.projectId || !peekIssue?.issueId) return <></>;
  return (
    <EpicView
      workspaceSlug={peekIssue.workspaceSlug}
      projectId={peekIssue.projectId}
      issueId={peekIssue.issueId}
      isLoading={getIsFetchingIssueDetails(peekIssue.issueId)}
      isError={error}
      is_archived={!!peekIssue.isArchived}
      permissions={{
        canEdit: permissions.getCanEdit(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId),
        canSubscribe: permissions.getCanSubscribe(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId),
        canDelete: permissions.getCanDelete(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId),
        canArchive: permissions.getCanArchive(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId),
        canRestore: permissions.getCanRestore(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId),
        canDuplicate: permissions.getCanDuplicate(peekIssue.workspaceSlug, peekIssue.projectId),
        canConvertToWorkItem: permissions.getCanConvertToWorkItem(
          peekIssue.workspaceSlug,
          peekIssue.projectId,
          peekIssue.issueId
        ),
      }}
      embedIssue={embedIssue}
      embedRemoveCurrentNotification={embedRemoveCurrentNotification}
      issueOperations={issueOperations}
    />
  );
});
