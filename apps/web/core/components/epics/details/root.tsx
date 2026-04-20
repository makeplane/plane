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

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// components
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { LayoutRoot } from "@/components/common/layout";
import { useEpicAnalytics } from "@/plane-web/hooks/store";
// local components
import { EpicEmptyState } from "./empty-state";
import { EpicMainContentRoot } from "./main/root";
import { EpicDetailsSidebar } from "./sidebar/root";
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";

export type TEpicDetailRoot = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  epicId: string;
};

export const EpicDetailRoot = observer(function EpicDetailRoot(props: TEpicDetailRoot) {
  const { editorRef, workspaceSlug, projectId, epicId } = props;
  // hooks
  const { fetchEpicAnalytics } = useEpicAnalytics();
  const { permissions } = useEpics();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  // derived values
  const epic = getIssueById(epicId);
  const commentsPermissions = permissions.getCommentPermissions(workspaceSlug, projectId, epicId);
  const updatesPermission = permissions.getUpdatePermissions(workspaceSlug, projectId, epicId);
  const allPermissions = {
    canEdit: permissions.getCanEdit(workspaceSlug, projectId, epicId),
    canEditProperty: (property: TWorkItemProperty) =>
      permissions.getCanEditProperty(workspaceSlug, projectId, epicId, property),
    canReact: permissions.getCanReact(workspaceSlug, projectId, epicId),
    canRestoreDescriptionVersion: permissions.getCanRestoreDescriptionVersion(workspaceSlug, projectId, epicId),
    canAddDependencies: permissions.getCanAddDependencies(workspaceSlug, projectId, epicId),
    canAddRelations: permissions.getCanAddRelations(workspaceSlug, projectId, epicId),
    canAddLinks: permissions.getCanAddLinks(workspaceSlug, projectId, epicId),
    canAddAttachments: permissions.getCanAddAttachments(workspaceSlug, projectId, epicId),
    canAddPages: permissions.getCanAddPages(workspaceSlug, projectId, epicId),
    canAddCustomerRequests: permissions.getCanAddCustomerRequests(workspaceSlug, projectId, epicId),
    comments: {
      canCreate: commentsPermissions.canCreate,
      canEdit: (commentId: string) => commentsPermissions.getCanEdit(commentId),
      canDelete: (commentId: string) => commentsPermissions.getCanDelete(commentId),
      canReact: (commentId: string) => commentsPermissions.getCanReact(commentId),
    },
    updates: {
      canAdd: updatesPermission.getCanCreate(),
      canEdit: (updateId: string) => updatesPermission.getCanEdit(updateId),
      canDelete: (updateId: string) => updatesPermission.getCanDelete(updateId),
      canReact: (updateId: string) => updatesPermission.getCanReact(updateId),
      comment: {
        canCreate: (updateId: string) => updatesPermission.getCommentPermissions(updateId).canCreate,
        canUpdate: (updateId: string, commentId: string) =>
          updatesPermission.getCommentPermissions(updateId).getCanEdit(commentId),
        canDelete: (updateId: string, commentId: string) =>
          updatesPermission.getCommentPermissions(updateId).getCanDelete(commentId),
        canReact: (updateId: string, commentId: string) =>
          updatesPermission.getCommentPermissions(updateId).getCanReact(commentId),
      },
    },
    sub_work_items: {
      getCanView: (projectId: string, _workItemId: string) => permissions.getCanView(workspaceSlug, projectId),
      getCanEdit: (projectId: string, workItemId: string) =>
        permissions.getCanEdit(workspaceSlug, projectId, workItemId),
      getCanEditProperty: (projectId: string, workItemId: string, property: TWorkItemProperty) =>
        permissions.getCanEditProperty(workspaceSlug, projectId, workItemId, property),
      getCanDelete: (projectId: string, workItemId: string) =>
        permissions.getCanDelete(workspaceSlug, projectId, workItemId),
      getCanAdd: (parentWorkItemProjectId: string, parentWorkItemId: string) =>
        permissions.getCanAddWorkItems(workspaceSlug, parentWorkItemProjectId, parentWorkItemId),
      getCanRemove: (
        parentWorkItemProjectId: string,
        parentWorkItemId: string,
        projectId: string,
        workItemId: string
      ) =>
        permissions.getCanEdit(workspaceSlug, parentWorkItemProjectId, parentWorkItemId) &&
        permissions.getCanEdit(workspaceSlug, projectId, workItemId),
    },
  };

  useSWR(
    workspaceSlug && projectId && epicId ? `EPIC_ANALYTICS_${workspaceSlug}_${projectId}_${epicId}` : null,
    workspaceSlug && projectId && epicId
      ? () => fetchEpicAnalytics(workspaceSlug.toString(), projectId.toString(), epicId.toString())
      : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  return (
    <>
      <LayoutRoot
        renderEmptyState={!epic}
        emptyStateComponent={<EpicEmptyState workspaceSlug={workspaceSlug} projectId={projectId} />}
      >
        <EpicMainContentRoot
          editorRef={editorRef}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          permissions={allPermissions}
        />
        <EpicDetailsSidebar
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          permissions={allPermissions}
        />
      </LayoutRoot>
      {/* peek overview */}
      <IssuePeekOverview storeType={EIssuesStoreType.PROJECT} />
    </>
  );
});
