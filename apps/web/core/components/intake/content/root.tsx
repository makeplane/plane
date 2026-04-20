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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { TNameDescriptionLoader } from "@plane/types";
// components
import { ContentWrapper } from "@plane/ui";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { InboxIssueActionsHeader } from "./intake-work-item-header";
import { InboxIssueMainContent } from "./work-item-root";
import type { TIntakeWorkItemProperty } from "@/store/inbox/permissions/root";

type TInboxContentRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
  isNotificationEmbed?: boolean;
  embedRemoveCurrentNotification?: () => void;
};

export const InboxContentRoot = observer(function InboxContentRoot(props: TInboxContentRoot) {
  const {
    workspaceSlug,
    projectId,
    inboxIssueId,
    isMobileSidebar,
    setIsMobileSidebar,
    isNotificationEmbed = false,
    embedRemoveCurrentNotification,
  } = props;
  /// router
  const router = useAppRouter();
  // states
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  // hooks
  const {
    currentTab,
    fetchInboxIssueById,
    getIssueInboxByIssueId,
    getIsIssueAvailable,
    permissions: intakePermissions,
  } = useProjectInbox();
  const inboxIssue = getIssueInboxByIssueId(inboxIssueId);
  const permissions = {
    canEdit: intakePermissions.getCanEdit(workspaceSlug, projectId, inboxIssueId),
    canEditProperty: (property: TIntakeWorkItemProperty) =>
      intakePermissions.getCanEditProperty(workspaceSlug, projectId, inboxIssueId, property),
    canReact: intakePermissions.getCanReact(workspaceSlug, projectId, inboxIssueId),
    canRestoreDescriptionVersion: intakePermissions.getCanRestoreDescriptionVersion(
      workspaceSlug,
      projectId,
      inboxIssueId
    ),
    canAddAttachments: intakePermissions.getCanAddAttachments(workspaceSlug, projectId, inboxIssueId),
    canAddWorklog: intakePermissions.getCanAddWorklog(workspaceSlug, projectId, inboxIssueId),
    comments: {
      canCreate: intakePermissions.getCommentPermissions(workspaceSlug, projectId, inboxIssueId).canCreate,
      canEdit: (commentId: string) =>
        intakePermissions.getCommentPermissions(workspaceSlug, projectId, inboxIssueId).getCanEdit(commentId),
      canDelete: (commentId: string) =>
        intakePermissions.getCommentPermissions(workspaceSlug, projectId, inboxIssueId).getCanDelete(commentId),
      canReact: (commentId: string) =>
        intakePermissions.getCommentPermissions(workspaceSlug, projectId, inboxIssueId).getCanReact(commentId),
    },
  };

  // derived values
  const isIssueAvailable = getIsIssueAvailable(inboxIssueId?.toString() || "");

  useEffect(() => {
    if (!isIssueAvailable && inboxIssueId && !isNotificationEmbed) {
      router.replace(`/${workspaceSlug}/projects/${projectId}/intake?currentTab=${currentTab}`);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isIssueAvailable, isNotificationEmbed]);

  useSWR(
    workspaceSlug && projectId && inboxIssueId
      ? `PROJECT_INBOX_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${inboxIssueId}`
      : null,
    workspaceSlug && projectId && inboxIssueId
      ? () => fetchInboxIssueById(workspaceSlug, projectId, inboxIssueId)
      : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  if (!inboxIssue) return <></>;
  return (
    <>
      <div className="w-full h-full overflow-hidden relative flex flex-col">
        <div className="flex-shrink-0 min-h-[52px] z-[11]">
          <InboxIssueActionsHeader
            setIsMobileSidebar={setIsMobileSidebar}
            isMobileSidebar={isMobileSidebar}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            inboxIssue={inboxIssue}
            isSubmitting={isSubmitting}
            isNotificationEmbed={isNotificationEmbed || false}
            embedRemoveCurrentNotification={embedRemoveCurrentNotification}
          />
        </div>
        <ContentWrapper className="divide-y-2 divide-subtle-1">
          <InboxIssueMainContent
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            inboxIssue={inboxIssue}
            permissions={permissions}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        </ContentWrapper>
      </div>
    </>
  );
});
