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

// plane imports
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// local imports
import { IssueDetailWidgetActionButtons } from "./action-buttons";
import { IssueDetailWidgetCollapsibles } from "./issue-detail-widget-collapsibles";
import { IssueDetailWidgetModals } from "./issue-detail-widget-modals";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  renderWidgetModals?: boolean;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
  permissions: {
    canAddDependencies: boolean;
    canAddRelations: boolean;
    canAddLinks: boolean;
    canAddAttachments: boolean;
    canAddPages: boolean;
    canAddCustomerRequests: boolean;
    sub_work_items: {
      getCanView: (projectId: string, workItemId: string) => boolean;
      getCanEdit: (projectId: string, workItemId: string) => boolean;
      getCanEditProperty: (projectId: string, workItemId: string, property: TWorkItemProperty) => boolean;
      getCanDelete: (projectId: string, workItemId: string) => boolean;
      getCanAdd: (parentWorkItemProjectId: string, parentWorkItemId: string) => boolean;
      getCanRemove: (
        parentWorkItemProjectId: string,
        parentWorkItemId: string,
        projectId: string,
        workItemId: string
      ) => boolean;
    };
  };
};

export function IssueDetailWidgets(props: Props) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    renderWidgetModals = true,
    issueServiceType,
    hideWidgets,
    permissions,
  } = props;

  return (
    <>
      <div className="flex flex-col gap-6">
        <IssueDetailWidgetActionButtons
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          permissions={{
            ...permissions,
            canAddSubWorkItems: permissions.sub_work_items.getCanAdd(projectId, issueId),
          }}
          issueServiceType={issueServiceType}
          hideWidgets={hideWidgets}
        />
        <IssueDetailWidgetCollapsibles
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          permissions={permissions}
          issueServiceType={issueServiceType}
          hideWidgets={hideWidgets}
        />
      </div>
      {renderWidgetModals && (
        <IssueDetailWidgetModals
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueServiceType={issueServiceType}
          hideWidgets={hideWidgets}
        />
      )}
    </>
  );
}
