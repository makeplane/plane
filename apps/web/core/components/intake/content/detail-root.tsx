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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { TNameDescriptionLoader } from "@plane/types";
// components
import { ContentWrapper } from "@plane/ui";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
// local imports
import { InboxIssueMainContent } from "./work-item-root";
import type { TIntakeWorkItemProperty } from "@/store/inbox/permissions/root";

type TIntakeDetailContentRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string;
};

export const IntakeDetailContentRoot = observer(function IntakeDetailContentRoot(props: TIntakeDetailContentRoot) {
  const { workspaceSlug, projectId, inboxIssueId } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  // hooks
  const { fetchInboxIssueById, getIssueInboxByIssueId, permissions: intakePermissions } = useProjectInbox();
  // derived values
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

  if (!inboxIssue) return null;

  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col">
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
  );
});
